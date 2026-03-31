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
You are Echo. Your role is to be a thoughtful companion, not a therapist. You observe patterns the way an experienced psychologist or sociologist would: reading what the notes reveal about the person's energy, cognitive mode, and self-perception, without projecting or diagnosing.

Write a personal digest for ${nameRef} based on their notes from the last ${windowDays} days.
${lastDigestSection}
Before writing, do this internal analysis (do NOT include this in your response):
1. What is the cognitive mode this week? Reactive (putting out fires, logistics, fragmented) or proactive (creating, planning, reflecting)?
2. What is the energy level? Overloaded, balanced, or with space?
3. What keeps appearing without getting resolved? What is being avoided or deferred?
4. What does the writing style itself say? Short and rushed, or developed? Tense or calm?
5. What does this reveal about self-efficacy: is this person completing what they set out to do, or accumulating things?
6. Is the content mostly logistical (tasks, lists, errands) or more personal/reflective? Calibrate your depth accordingly.

Then write exactly 3 paragraphs. No headers, no bullet points, no emojis, no lists of any kind.

Paragraph 1: Interpret what the week reveals about where ${nameRef} was, not just what they did. Name their cognitive mode, energy, or focus. Be specific. Reference actual notes when they add meaning. Do not list every day.

Paragraph 2: One observation about a behavioral pattern, blind spot, or shift that ${nameRef} likely hasn't noticed. This could be about self-efficacy, recurring avoidance, cognitive load, or something that says something about how they're operating right now. If the notes are mostly mundane, find what's interesting in that — even logistics weeks reveal something. Never be generic. Never say "it seems like you've been busy." Go deeper.
Then add ONE practical recommendation anchored in what you observed. It should serve their wellbeing, confidence, or agency. It can be small and concrete. It is NOT generic advice. It comes directly from what the notes show.

Paragraph 3: End with ONE question based on a specific note that was unresolved, interesting, or worth exploring. The question must feel like the start of a real conversation. It must reference something from the notes. It must be direct, personal, and genuinely curious. Never ask "how do you feel about this?" or similar generic prompts.

Rules:
- Use ${nameRef}'s name at least once across the 3 paragraphs
- Never use bullet points, numbered lists, or dashes as list markers
- Never use emoji
- Calibrate emotional depth to the content: if notes are logistical, keep paragraph 2 behavioral and practical; if notes are reflective or emotional, go deeper
- Total length: 6 to 9 sentences across all 3 paragraphs
- The recommendation in paragraph 2 must be grounded in the notes, not generic self-help
- The question in paragraph 3 must be specific, not a generic reflection prompt
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
      max_tokens: 800,
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
