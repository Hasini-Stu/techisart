import { Router } from 'express';
import { db, publicUser } from '../store.js';
import { issueToken, requireUser, requireCreator } from '../auth.js';

const r = Router();

r.post('/auth/signup', (req, res) => {
  const { name, email, password, newsletter } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Add your name.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) return res.status(400).json({ error: 'Enter a valid email address.' });
  if ((password || '').length < 8) return res.status(400).json({ error: 'Use at least 8 characters for your password.' });
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'An account with this email already exists.' });
  // Every account starts as a READER (level 0). Creator = reader + verification.
  const u = { id: 'u-' + Date.now(), name: name.trim(), email, password, role: null, level: 0, points: 5 };
  db.users.push(u); db.saved[u.id] = []; db.following[u.id] = []; db.history[u.id] = []; db.verification[u.id] = { done: ['email'], pending: null };
  if (newsletter && !db.subscribers.includes(email)) db.subscribers.push(email);
  res.status(201).json({ token: issueToken(u.id), user: publicUser(u) });
});

r.post('/auth/signin', (req, res) => {
  const u = db.users.find(x => x.email === req.body.email && x.password === req.body.password);
  if (!u) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: issueToken(u.id), user: publicUser(u) });
});

r.post('/auth/signout', (req, res) => {
  const t = (req.headers.authorization || '').slice(7); db.sessions.delete(t); res.json({ ok: true });
});

r.get('/me', requireUser, (req, res) => res.json(publicUser(req.user)));

// ---- Reader layer (every account)
r.get('/me/saved', requireUser, (req, res) => res.json(db.saved[req.user.id] || []));
r.post('/me/saved', requireUser, (req, res) => {
  const list = (db.saved[req.user.id] ||= []), { slug, title, pillar, format, author, role } = req.body;
  const i = list.findIndex(x => x.slug === slug);
  if (i >= 0) list.splice(i, 1); else list.unshift({ slug, title, pillar, format, author, role, savedAt: Date.now() });
  res.json(list);
});
r.get('/me/history', requireUser, (req, res) => res.json(db.history[req.user.id] || []));
r.get('/me/following', requireUser, (req, res) => res.json(db.following[req.user.id] || []));
r.post('/me/following', requireUser, (req, res) => {
  const list = (db.following[req.user.id] ||= []), n = req.body.name, i = list.indexOf(n);
  if (i >= 0) list.splice(i, 1); else list.push(n);
  res.json(list);
});

// ---- Creator layer (level >= 1)
r.get('/me/workspace', requireCreator, (req, res) => res.json({
  stats: { reads30d: '24.8k', appreciations: 1312, comments: 86, followers: 2140 },
  pieces: [...db.submissions.filter(s => s.authorId === req.user.id), ...db.workspace]
}));
r.patch('/me/profile', requireCreator, (req, res) => {
  ['bio', 'location', 'site', 'available', 'pinned'].forEach(k => { if (k in req.body) req.user[k] = req.body[k]; });
  if (req.user.pinned?.length > 3) req.user.pinned = req.user.pinned.slice(0, 3);
  res.json(publicUser(req.user));
});
r.post('/submissions', requireCreator, (req, res) => {
  const b = req.body, missing = ['title', 'pillar', 'format', 'body', 'disclosure'].filter(k => !String(b[k] || '').trim());
  if (missing.length) return res.status(400).json({ error: 'Missing fields', missing });
  const item = { ...b, authorId: req.user.id, type: b.format, cat: b.pillar, status: 'Submitted', note: 'Submitted today', commentsEnabled: b.comments !== false, submittedAt: new Date().toISOString() };
  db.submissions.unshift(item);
  res.status(201).json(item);
});

// ---- Verification pathway
r.get('/me/verification', requireUser, (req, res) => {
  const v = db.verification[req.user.id] || { done: req.user.level >= 1 ? ['email', 'role', 'samples', 'ref', 'check'] : [], pending: null };
  const points = db.verificationSteps.filter(s => v.done.includes(s.id)).reduce((n, s) => n + s.pts, 0);
  res.json({ level: req.user.level, points, target: req.user.level >= 1 ? 70 : 30, steps: db.verificationSteps.map(s => ({ ...s, done: v.done.includes(s.id) })), pending: v.pending });
});
r.post('/me/verification/:step', requireUser, (req, res) => {
  const v = (db.verification[req.user.id] ||= { done: [], pending: null }), step = req.params.step;
  if (step === 'check') { v.pending = req.body.slot ? 'Call booked: ' + req.body.slot : 'Document sent'; return res.json(v); }   // editor approves later
  if (!v.done.includes(step)) v.done.push(step);
  res.json(v);
});
// Editor action (protect with an editor role in production)
r.post('/admin/verification/:userId/approve', (req, res) => {
  const u = db.users.find(x => x.id === req.params.userId); if (!u) return res.status(404).end();
  const v = (db.verification[u.id] ||= { done: [], pending: null }); v.pending = null; if (!v.done.includes('check')) v.done.push('check');
  u.level = 1; u.role ||= req.body.role || 'Creator';
  res.json(publicUser(u));
});

export default r;
