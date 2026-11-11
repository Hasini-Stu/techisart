import { Router } from 'express';
import { db, slugify } from '../store.js';
import { currentUser, requireUser } from '../auth.js';

const r = Router();
const terms = (q) => (q || '').toLowerCase().split(/\s+/).filter(Boolean);
const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);
const rating = (slug, seed = { sum: 0, count: 0 }) => {
  const extra = Object.values(db.ratings[slug] || {});
  const sum = seed.sum + extra.reduce((a, b) => a + b, 0), count = seed.count + extra.length;
  return { average: count ? +(sum / count).toFixed(1) : null, count };
};

r.get('/pillars', (_req, res) => res.json(db.pillars));

r.get('/home', (_req, res) => {
  const by = (p) => db.articles.filter(a => a.pillar === p).slice(0, 4);
  res.json({
    lead: db.articles.find(a => a.blocks),
    sections: ['Beauty', 'Fashion', 'Music', 'Art'].map(name => ({ name, blurb: db.pillars.find(p => p.name === name)?.blurb, items: by(name) })),
    latest: db.latest,
    research: db.research.slice(0, 4),
    opportunities: db.opportunities.filter(o => o.days >= 0).slice(0, 3)
  });
});

// GET /api/articles?pillar=Art&format=Article&q=plotter
r.get('/articles', (req, res) => {
  const { pillar, format, q } = req.query, t = terms(q);
  const out = db.articles.filter(a => (!pillar || a.pillar === pillar) && (!format || a.format === format) &&
    t.every(w => (a.title + ' ' + a.deck + ' ' + a.author).toLowerCase().includes(w)));
  res.json({ total: out.length, items: out });
});

r.get('/articles/:slug', (req, res) => {
  const a = db.articles.find(x => x.slug === req.params.slug) || db.research.find(x => x.slug === req.params.slug);
  if (!a) return res.status(404).json({ error: 'Not found' });
  const u = currentUser(req);
  if (u) db.history[u.id] = [{ slug: a.slug, title: a.title, at: Date.now() }, ...(db.history[u.id] || []).filter(h => h.slug !== a.slug)].slice(0, 20);
  res.json({ ...a, pillar: a.pillar || a.field, format: a.format || a.type, published: a.published || (a.publishedDaysAgo != null ? new Date(Date.UTC(2026, 10, 5) - a.publishedDaysAgo * 864e5).toISOString().slice(0, 10) : undefined), rating: rating(a.slug, a.rating), myRating: u ? db.ratings[a.slug]?.[u.id] ?? null : null,
    comments: a.commentsEnabled ? (db.comments[a.slug] || []) : [] });
});

r.post('/articles/:slug/rating', requireUser, (req, res) => {
  const v = Number(req.body.value);
  if (!(v >= 1 && v <= 5)) return res.status(400).json({ error: 'Rating must be 1–5' });
  (db.ratings[req.params.slug] ||= {})[req.user.id] = v;   // one rating per reader; re-rating replaces it
  const a = db.articles.find(x => x.slug === req.params.slug) || db.research.find(x => x.slug === req.params.slug);
  res.json(rating(req.params.slug, a?.rating));
});

r.post('/articles/:slug/comments', requireUser, (req, res) => {
  const a = db.articles.find(x => x.slug === req.params.slug);
  if (!a?.commentsEnabled) return res.status(403).json({ error: 'Comments are off for this piece' });
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Empty comment' });
  const c = { id: Date.now(), name: req.user.name, role: req.user.role || 'Reader', verified: req.user.level >= 1, isAuthor: req.user.name === a.author, time: 'Just now', text, replies: [] };
  const list = (db.comments[a.slug] ||= []);
  if (req.body.parentId) { const p = list.find(x => x.id === Number(req.body.parentId)); if (!p) return res.status(404).end(); p.replies.push(c); }
  else list.unshift(c);
  res.status(201).json(c);
});

// Author toggles comments on their own piece
r.patch('/articles/:slug/comments-enabled', requireUser, (req, res) => {
  const a = db.articles.find(x => x.slug === req.params.slug);
  if (!a || a.author !== req.user.name) return res.status(403).json({ error: 'Only the author can change this' });
  a.commentsEnabled = !!req.body.enabled; res.json({ commentsEnabled: a.commentsEnabled });
});

// GET /api/research?q=&field=Art,Music&type=Study&source=Peer-reviewed&role=Expert&date=last-year|last-3-years|custom&from=2023&to=2026&verified=true&sort=recent|relevant|cited|picks
r.get('/research', (req, res) => {
  const q = req.query, t = terms(q.q);
  const fields = list(q.field), types = list(q.type), sources = list(q.source), roles = list(q.role);
  const year = (days) => new Date(Date.UTC(2026, 10, 5) - days * 864e5).getUTCFullYear();
  const dateOk = (d) => !q.date || q.date === 'any' || (q.date === 'last-year' ? d <= 365 : q.date === 'last-3-years' ? d <= 1095 : year(d) >= (+q.from || 0) && year(d) <= (+q.to || 9999));
  const hay = (x) => (x.title + ' ' + x.abstract + ' ' + x.author + ' ' + x.tags.join(' ')).toLowerCase();
  const score = (x) => t.reduce((n, w) => n + (x.title.toLowerCase().includes(w) ? 3 : 0) + (x.tags.join(' ').toLowerCase().includes(w) ? 2 : 0) + (x.author.toLowerCase().includes(w) ? 2 : 0) + (x.abstract.toLowerCase().includes(w) ? 1 : 0), 0);
  let out = db.research.filter(x => (!fields.length || fields.includes(x.field)) && (!types.length || types.includes(x.type)) &&
    (!sources.length || sources.includes(x.source)) && (!roles.length || roles.includes(x.cls)) && (q.verified !== 'true' || x.verified) &&
    dateOk(x.publishedDaysAgo) && t.every(w => hay(x).includes(w)));
  const sorts = { recent: (a, b) => a.publishedDaysAgo - b.publishedDaysAgo, relevant: (a, b) => score(b) - score(a), cited: (a, b) => b.cites - a.cites, picks: (a, b) => (b.pick - a.pick) || a.publishedDaysAgo - b.publishedDaysAgo };
  out = out.sort(sorts[q.sort] || sorts.recent);
  res.json({ total: out.length, items: out });
});

// Typeahead: GET /api/research/suggest?q=lat
r.get('/research/suggest', (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  const tags = [...new Set(db.research.flatMap(x => x.tags))];
  const authors = [...new Set(db.research.map(x => x.author))];
  res.json({
    pieces: q ? db.research.filter(x => x.title.toLowerCase().includes(q)).slice(0, 3).map(x => ({ slug: x.slug, title: x.title, type: x.type })) : [],
    authors: q ? authors.filter(a => a.toLowerCase().includes(q)).slice(0, 3).map(a => ({ name: a, role: db.research.find(x => x.author === a).role })) : [],
    topics: (q ? tags.filter(x => x.includes(q)) : tags).slice(0, 6)
  });
});

// Creator portfolio (public)
r.get('/creators/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const u = db.users.find(x => x.name === name);
  const works = [...db.articles, ...db.research].filter(a => a.author === name);
  res.json({ name, role: u?.role || works[0]?.role || 'Contributor', bio: u?.bio || '', location: u?.location || '', available: !!u?.available, site: u?.site || '',
    pinned: (u?.pinned || []), works: name === 'Mara Okonkwo-Lind' ? db.portfolioWorks : works,
    stats: { published: name === 'Mara Okonkwo-Lind' ? 42 : works.length, reads: '186k', appreciations: '9.4k', editorsPicks: 6 } });
});

r.post('/subscribe', (req, res) => {
  const email = String(req.body.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!db.subscribers.includes(email)) db.subscribers.push(email);
  res.status(201).json({ ok: true });
});

export default r;
