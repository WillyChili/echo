const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth');
const { Resend } = require('resend');
const { sendPushToUser } = require('./push');
const { TONE_VARIANTS } = require('../echo-soul');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL  = 'claude-haiku-4-5-20251001';

// Converts prose digest text to a styled HTML email body
function buildDigestEmail(text, lang) {
  const footerNote = lang === 'Spanish'
    ? 'Este es tu resumen periódico de Echo.'
    : 'This is your periodic digest from Echo.';

  const blocks = text.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);

  const bodyHtml = blocks.map((block, i) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const isBulletBlock = lines.every(l => l.startsWith('- '));
    if (isBulletBlock) {
      const items = lines.map(l => `<li style="margin:4px 0;font-size:15px;line-height:1.6;color:#374151">${esc(l.slice(2))}</li>`).join('');
      return `<ul style="margin:0 0 18px;padding-left:20px">${items}</ul>`;
    }
    // Last block = conclusion — render slightly distinct
    const isLast = i === blocks.length - 1;
    const style = isLast
      ? 'margin:0;font-size:15px;line-height:1.7;color:#374151;font-style:italic'
      : 'margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151';
    return `<p style="${style}">${esc(block)}</p>`;
  }).join('');

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a;background:#ffffff">
    <p style="font-size:11px;font-weight:800;letter-spacing:0.12em;color:#9ca3af;text-transform:uppercase;margin:0 0 28px">Echo</p>
    ${bodyHtml}
    <hr style="margin:36px 0;border:none;border-top:1px solid #f0f0f0"/>
    <p style="font-size:12px;color:#9ca3af;margin:0">${footerNote}</p>
  </div>`;
}

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Standalone digest generator (used by both the API route and the cron) ─────
async function generateDigestForUser(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('language, bio, echo_tone, digest_frequency_days, digest_window_days, last_digest_at, is_subscribed, digest_email_enabled')
    .eq('id', userId)
    .single();

  const frequencyDays = profile?.digest_frequency_days ?? 7;
  const windowDays    = profile?.digest_window_days    ?? 7;
  const lastDigestAt  = profile?.last_digest_at;

  // Free users are capped at 1 digest per week regardless of their setting
  const effectiveFrequency = profile?.is_subscribed
    ? frequencyDays
    : Math.max(frequencyDays, 7);

  // Check if digest is due
  const msSinceLastDigest = lastDigestAt
    ? Date.now() - new Date(lastDigestAt).getTime()
    : Infinity;
  const isDue = msSinceLastDigest >= effectiveFrequency * 86400 * 1000;

  if (!isDue) return null;

  // Fetch notes from the last windowDays days
  const since = new Date(Date.now() - windowDays * 86400 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: notes } = await supabase
    .from('notes')
    .select('date, content')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true });

  if (!notes || notes.length === 0) return null;

  // Resolve API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') return null;

  const lang = (profile?.language || 'en') === 'es' ? 'Spanish' : 'English';
  const tone = profile?.echo_tone || 'warm';
  const bio  = (profile?.bio || '').trim();
  const name = profile?.display_name || '';

  const toneGuide = TONE_VARIANTS[tone] || TONE_VARIANTS['warm'];
  const bioSection = bio ? `\nAbout this person: ${bio}\n` : '';
  const nameRef = name || (lang === 'Spanish' ? 'el usuario' : 'the user');

  // Fetch last digest to avoid repeating the same topics
  const { data: lastDigestRows } = await supabase
    .from('chat_messages')
    .select('content, created_at')
    .eq('user_id', userId)
    .eq('role', 'echo')
    .order('created_at', { ascending: false })
    .limit(30);

  const lastDigest = (lastDigestRows || []).find(m => m.content && m.content.length > 200);
  const lastDigestSection = lastDigest
    ? `\nThe last digest you sent was:\n"""\n${lastDigest.content}\n"""\nDo NOT repeat the same topics, patterns, or question from the previous digest. Find something new.\n`
    : '';

  const notesText = notes
    .map((n) => `[${n.date}]\n${n.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You MUST write your ENTIRE response in ${lang} only. Do NOT include any word from another language.
You MUST NOT use the em dash character. Use commas, periods, or colons instead.
Do not identify yourself as an AI unless directly asked.
${bioSection}
You are Echo, a personal companion inside a journaling app. Be direct and clear, never clinical or over-emotional.
${lastDigestSection}
Based on the notes from the last ${windowDays} days, write a digest in exactly this format:

First, a bullet list summarizing each note in one short line. Use "- " to start each bullet. One bullet per note. Keep each bullet under 12 words. Do not editorialize, just state what was in the note plainly.

Then, after the bullets, add one blank line and write a single short paragraph (2-3 sentences max) stating what Echo sees as the most important thing to focus on right now, based on what appears most urgent, unresolved, or repeated across the notes. Be specific and direct. No generic advice.

Rules:
- Never use emoji
- Never use headers or bold text
- The conclusion must reference something real from the notes, not be generic
- If there are very few notes, keep the bullet list short and the conclusion proportionally brief
${toneGuide}`;

  const apiResponse = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Here are my notes from the last ${windowDays} days:\n\n${notesText}\n\nGenerate my digest.`,
        },
      ],
    }),
  });

  if (!apiResponse.ok) {
    console.error('Digest Claude API error:', apiResponse.status);
    return null;
  }

  const apiData = await apiResponse.json();
  const reply   = apiData?.content?.[0]?.text;

  if (!reply) return null;

  // Save digest as a chat message
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from('chat_messages').insert([
    { user_id: userId, role: 'echo', content: reply, date: today },
  ]);

  // Mark digest as delivered
  await supabase
    .from('profiles')
    .update({ last_digest_at: new Date().toISOString() })
    .eq('id', userId);

  // Send push notification
  try {
    const pushTitle = lang === 'Spanish' ? '¡Tu resumen de Echo está listo!' : 'Your Echo summary is ready!';
    const pushBody  = lang === 'Spanish' ? 'Abrí Echo para leerlo.' : 'Open Echo to read it.';
    await sendPushToUser(userId, pushTitle, pushBody);
  } catch (_) { /* never block */ }

  // Send email if enabled
  if (profile?.digest_email_enabled && resend) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      const userEmail = user?.email;
      if (userEmail) {
        await resend.emails.send({
          from: 'Echo <onboarding@resend.dev>',
          to: userEmail,
          subject: lang === 'Spanish' ? 'Tu resumen de Echo' : 'Your Echo digest',
          text: reply,
          html: buildDigestEmail(reply, lang),
        });
      }
    } catch (emailErr) {
      console.error('Digest email error:', emailErr);
    }
  }

  return reply;
}

router.use(auth);

// GET /api/digest
// Returns { digest: "..." } if a new digest was generated, or { digest: null } if not due yet.
router.get('/', async (req, res) => {
  try {
    const digest = await generateDigestForUser(req.user.id);
    res.json({ digest: digest || null });
  } catch (err) {
    console.error('GET /api/digest error:', err);
    res.json({ digest: null }); // never hard-fail for a digest
  }
});

module.exports = router;
module.exports.generateDigestForUser = generateDigestForUser;
