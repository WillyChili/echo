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

  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  const bodyHtml = paragraphs
    .map((p, i) => {
      // Last paragraph is the question — render it slightly distinct
      const isQuestion = i === paragraphs.length - 1 && p.includes('?');
      const style = isQuestion
        ? 'margin:24px 0 0;font-size:15px;line-height:1.7;color:#374151;font-style:italic'
        : 'margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151';
      return `<p style="${style}">${esc(p)}</p>`;
    })
    .join('');

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
You MUST NOT use the em dash character. Use commas, periods, or colons to separate ideas.
Do not identify yourself as an AI unless directly asked.
${bioSection}
You are Echo. Write a personal digest for ${nameRef} based on their notes from the last ${windowDays} days.
${lastDigestSection}
Write exactly 3 paragraphs. No headers, no bullet points, no emojis, no lists of any kind.

Paragraph 1: Synthesize what happened this period naturally. Reference specific notes and their dates when it adds meaning. Do not list every day chronologically — extract what actually matters and connect it.

Paragraph 2: Name one specific pattern, shift, or blind spot you noticed across the notes that ${nameRef} might not have seen themselves. Be concrete, not generic. Avoid obvious observations.

Paragraph 3: End with ONE question based on a specific note that was unresolved, interesting, or worth exploring further. The question must feel like the natural start of a conversation. It must reference something real from the notes. It must be direct and personal, not generic like "how do you feel about this?".

Rules:
- Use ${nameRef}'s name naturally at least once across the 3 paragraphs
- Never use bullet points, dashes as list markers, or numbered lists
- Never use emoji
- Total length: 5 to 8 sentences across all 3 paragraphs. Be concise.
- The question in paragraph 3 must be specific to the notes, not a generic reflection prompt
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
      max_tokens: 600,
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
