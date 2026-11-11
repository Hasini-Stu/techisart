import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const load = (name) => JSON.parse(readFileSync(join(dir, name + '.json'), 'utf8'));

// In-memory store seeded from /data. Replace with a real database (Postgres, Mongo…) in production.
export const db = {
  articles: load('articles'),
  research: load('research'),
  opportunities: load('opportunities'),
  latest: load('latest'),
  comments: load('comments'),
  users: load('users'),
  workspace: load('workspace'),
  verificationSteps: load('verification-steps'),
  pillars: load('pillars'),
  portfolioWorks: load('portfolio-works'),
  saved: { 'u-mara': [], 'u-alex': [] },
  following: { 'u-mara': ['Camille Duret', 'Dr. Hanna Lew'], 'u-alex': [] },
  history: { 'u-mara': [], 'u-alex': [] },
  ratings: {},          // { [slug]: { [userId]: 1..5 } }
  subscribers: [],
  submissions: [],
  opportunitySubmissions: [],
  verification: { 'u-alex': { done: ['email', 'role'], pending: null } },
  sessions: new Map()   // token -> userId
};

export const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
export const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, role: u.role, level: u.level, points: u.points, isCreator: u.level >= 1, location: u.location, available: u.available, bio: u.bio, site: u.site });
