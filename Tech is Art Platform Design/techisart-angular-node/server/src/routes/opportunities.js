import { Router } from 'express';
import { db } from '../store.js';

const r = Router();
const list = (v) => (v ? String(v).split(',').filter(Boolean) : []);
export const statusOf = (o) => o.days < 0 ? 'Closed' : o.days <= 14 ? 'Closing soon' : 'Open';

// GET /api/opportunities?q=&type=Grant&status=Open,Closing soon&fee=Free&who=Students&format=Online&prize=Cash&field=Art&sort=closing|newest|prize
r.get('/', (req, res) => {
  const q = req.query, t = String(q.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  const f = { status: list(q.status), fee: list(q.fee), who: list(q.who), format: list(q.format), prize: list(q.prize), field: list(q.field) };
  const any = (arr, vals) => !arr.length || vals.some(v => arr.includes(v));
  let out = db.opportunities.filter(o => (!q.type || q.type === 'All' || o.type === q.type) &&
    any(f.status, [statusOf(o)]) && any(f.fee, [o.fee]) && any(f.who, o.who) && any(f.format, [o.format]) && any(f.prize, o.prizes) && any(f.field, o.fields) &&
    t.every(w => (o.title + ' ' + o.org + ' ' + o.desc + ' ' + o.fields.join(' ')).toLowerCase().includes(w)));
  const sorts = { closing: (a, b) => ((a.days < 0) - (b.days < 0)) || a.days - b.days, newest: (a, b) => a.posted - b.posted, prize: (a, b) => b.prizeValue - a.prizeValue };
  out = out.sort((a, b) => (b.sponsored - a.sponsored) || (sorts[q.sort] || sorts.closing)(a, b));   // sponsored first, always labelled
  res.json({ total: out.length, items: out.map(o => ({ ...o, status: statusOf(o) })) });
});

r.get('/:id', (req, res) => {
  const o = db.opportunities.find(x => String(x.id) === req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  res.json({ ...o, status: statusOf(o) });
});

// Organiser submission → moderation queue (never live until an editor approves)
r.post('/', (req, res) => {
  const b = req.body, need = ['title', 'type', 'description', 'deadline', 'link', 'org', 'email'];
  const missing = need.filter(k => !String(b[k] || '').trim());
  if (!b.fields?.length) missing.push('fields'); if (!b.who?.length) missing.push('who'); if (!b.prizes?.length) missing.push('prizes');
  if (missing.length) return res.status(400).json({ error: 'Missing fields', missing });
  const item = { ...b, id: Date.now(), status: 'Pending review', submittedAt: new Date().toISOString() };
  db.opportunitySubmissions.push(item);
  res.status(201).json(item);
});

export default r;
