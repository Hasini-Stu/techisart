import { randomBytes } from 'node:crypto';
import { db } from './store.js';

// Demo session auth. In production: hash passwords (bcrypt/argon2), use httpOnly cookies or JWT, add rate limiting.
export function issueToken(userId) {
  const token = randomBytes(24).toString('hex');
  db.sessions.set(token, userId);
  return token;
}

export function currentUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const id = token && db.sessions.get(token);
  return id ? db.users.find(u => u.id === id) : null;
}

export const requireUser = (req, res, next) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Sign in required' });
  req.user = u; next();
};

export const requireCreator = (req, res, next) => requireUser(req, res, () => {
  if (req.user.level < 1) return res.status(403).json({ error: 'Verification required (Level 1)' });
  next();
});
