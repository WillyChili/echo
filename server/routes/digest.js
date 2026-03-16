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

// Converts structured digest text to a styled HTML email body
function buildDigestEmail(text, lang) {
  const footerNote = lang === 'Spanish'
    ? 'Este es tu resumen periódico de Echo.'
    : 'This is your periodic digest from Echo.';

  const lines = text.split('\n');
  let bodyHtml = '';
  let inBullets = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      if (inBullets) { bodyHtml += '</ul>'; inBullets = false; }
      continue;
    }

    if (line.startsWith('📅')) {
      // Day header
      if (inBullets) { bodyHtml += '</ul>'; inBullets = false; }
      const label = line.replace('📅', '').trim();
      bodyHtml += `<p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #f0f0f0;padding-bottom:6px">${esc(label)}</p>`;

    } else if (line.startsWith('•')) {
      // Bullet point
      if (!inBullets) { bodyHtml += '<ul style="margin:4px 0 4px 0;padding-left:20px;color:#374151">'; inBullets = true; }
      bodyHtml += `<li style="margin:5px 0;font-size:15px;line-height:1.5">${esc(line.replace(/^•\s*/, ''))}</li>`;

    } else if (line.endsWith(':') && line.length < 60) {
      // Section header like "Temas clave:" or "Reflection:"
      if (inBullets) { bodyHtml += '</ul>'; inBullets = false; }
      bodyHtml += `<p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#6b7280">${esc(line.slice(0, -1))}</p>`;

    } else {
      // Reflection / free text paragraph
      if (inBullets) { bodyHtml += '</ul>'; inBullets = false; }
      bodyHtml += `<p style="margin:10px 0;font-size:15px;line-height:1.7;color:#374151;font-style:italic">${esc(line)}</p>`;
    }
  }
  if (inBullets) bodyHtml += '</ul>';

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

router.use(auth);

// GET /api/digest
// Returns { digest: "..." } if a new digest was generated, or { digest: null } if not due yet.
router.get('/', async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('language, bio, echo_tone, digest_frequency_days, digest_window_days, last_digest_at, is_subscribed, digest_email_enabled')
      .eq('id', req.user.id)
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

    if (!isDue) {
      return res.json({ digest: null });
    }

    // Fetch notes from the last windowDays days
    const since = new Date(Date.now() - windowDays * 86400 * 1000)
      .toISOString()
      .slice(0, 10);

    const { data: notes } = await supabase
      .from('notes')
      .select('date, content')
      .eq('user_id', req.user.id)
      .gte('date', since)
      .order('date', { ascending: true });

    if (!notes || notes.length === 0) {
      return res.json({ digest: null });
    }

    // Resolve API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      return res.json({ digest: null });
    }

    const lang = (profile?.language || 'en') === 'es' ? 'Spanish' : 'English';
    const tone = profile?.echo_tone || 'warm';
    const bio  = (profile?.bio || '').trim();

    const toneGuide = TONE_VARIANTS[tone] || TONE_VARIANTS['warm'];

    const bioSection = bio ? `\nAbout this person:\n${bio}\n` : '';

    const notesText = notes
      .map((n) => `[${n.date}]\n${n.content}`)
      .join('\n\n---\n\n');

    const themesLabel      = lang === 'Spanish' ? 'Temas clave' : 'Key themes';
    const reflectionLabel  = lang === 'Spanish' ? 'Reflexión'   : 'Reflection';
    const dateLocale       = lang === 'Spanish' ? 'es-AR'       : 'en-US';

    const systemPrompt = `You MUST write your ENTIRE response in ${lang} only. Do NOT include any word from another language.
You MUST NOT use the em dash character. Use commas, periods, or colons to separate ideas.
Do not identify yourself as an AI unless directly asked.
${bioSection}
You are Echo. Generate a structured digest of the user's notes from the last ${windowDays} days.

Use this EXACT format (no deviations):

📅 [Day name, day and month — e.g. "Miércoles, 5 de marzo" or "Wednesday, March 5"]
• [concise summary of one note or task from that day]
• [another note if there are multiple — omit if only one]

(Repeat for each day that has notes. Only include days with actual notes.)

${themesLabel}:
• [main pattern or theme across all notes — 1 short line]
• [second pattern — 1 short line]

${reflectionLabel}:
[1-2 sentences of personal insight addressed directly to the user. ${toneGuide}]

Rules:
- Only include days with actual notes
- Keep bullet points short and concrete
- Maximum 2 theme bullets
- The reflection is the only free-form paragraph`;

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
      return res.json({ digest: null });
    }

    const apiData = await apiResponse.json();
    const reply   = apiData?.content?.[0]?.text;

    if (!reply) {
      return res.json({ digest: null });
    }

    // Save digest as a chat message
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('chat_messages').insert([
      { user_id: req.user.id, role: 'echo', content: reply, date: today },
    ]);

    // Mark digest as delivered
    await supabase
      .from('profiles')
      .update({ last_digest_at: new Date().toISOString() })
      .eq('id', req.user.id);

    // Send push notification
    try {
      const pushTitle = lang === 'Spanish' ? '¡Tu resumen de Echo está listo!' : 'Your Echo summary is ready!';
      const pushBody  = lang === 'Spanish' ? 'Abrí Echo para leerlo.' : 'Open Echo to read it.';
      await sendPushToUser(req.user.id, pushTitle, pushBody);
    } catch (_) { /* never block response */ }

    // Send email if enabled
    if (profile?.digest_email_enabled && resend) {
      try {
        const { data: { user } } = await supabase.auth.admin.getUserById(req.user.id);
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
        console.error('Digest email error:', emailErr); // never block the response
      }
    }

    res.json({ digest: reply });
  } catch (err) {
    console.error('GET /api/digest error:', err);
    res.json({ digest: null }); // never hard-fail for a digest
  }
});

module.exports = router;
