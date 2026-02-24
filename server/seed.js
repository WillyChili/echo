// Run with: node server/seed.js
// Seeds the DB with 3 example notes so the app isn't empty on first run

const db = require('./db');

const today = new Date();
const fmt = (d) => d.toISOString().split('T')[0];

const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return fmt(d);
};

const seeds = [
  {
    date: daysAgo(14),
    content: `Couldn't sleep again last night. Brain just wouldn't quit — kept cycling through the same three things: the project deadline, whether I said something weird at dinner with Marcus, and this nagging feeling that I'm behind on everything in a way that's hard to articulate.

Went for a run at 6am to shake it off. It half worked. There's something about the first mile where I feel resistance and then something releases. By mile two I was actually thinking clearly for the first time all week.

Need to just pick one thing and finish it instead of doing 60% of five things. Classic me. I know this about myself and still do it.`,
  },
  {
    date: daysAgo(7),
    content: `good day honestly. finished the design doc finally, sent it off. weight off my chest. also made that pasta thing from the video and it actually turned out well?? who knew

texted mom back. she worries when I go quiet. I always mean to call more and then a week slips by somehow.

thinking about journaling more consistently. I read that it helps with anxiety and I'm skeptical but I'm also desperate enough to try it lol. we'll see how long this lasts`,
  },
  {
    date: daysAgo(2),
    content: `Weird mood today. Not sad exactly, just... flat. Like the volume got turned down on everything.

Spent an hour reading instead of working — Piranesi, which is genuinely strange and I love it. Sometimes the best thing is to just disappear into a book for a bit.

I keep thinking about what I actually want, not just what I'm supposed to want. There's a gap there I can't quite name yet. Something to think about more.

On the upside: coffee was excellent this morning and the light through the window was doing that thing in the afternoon. small things.`,
  },
];

const upsert = db.prepare(`
  INSERT INTO notes (date, content, created_at, updated_at)
  VALUES (?, ?, datetime('now'), datetime('now'))
  ON CONFLICT(date) DO UPDATE SET
    content = excluded.content,
    updated_at = datetime('now')
`);

for (const seed of seeds) {
  upsert.run(seed.date, seed.content);
  console.log(`Seeded note for ${seed.date}`);
}

console.log('Seeding complete.');
