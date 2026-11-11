# TechIsArt — Angular + Node.js

A working starter implementation of the TechIsArt design: an **Angular 18** front end (standalone components, signals, new control flow) and a **Node.js / Express** API with seed data taken from the prototype.

```
techisart-angular-node/
├── client/            Angular 18 app (port 4200, proxies /api → 3000)
├── server/            Express API (port 3000), in-memory store seeded from server/data/*.json
└── design-reference/  The HTML prototype this was built from (open Tech is Art.dc.html in a browser)
```

## Run it

```bash
# 1. API
cd server && npm install && npm run dev        # http://localhost:3000/api/health

# 2. Web app (second terminal)
cd client && npm install && npm start          # http://localhost:4200
```

Demo accounts (password `password1`):
- **mara@marasketch.studio**: creator (Level 1, verified Creative Technologist)
- **alex@example.com**: reader (Level 0, unverified)

## What's implemented

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Lead story, Latest list, format filter, pillar sections, Research band, Open calls |
| `/about` | About | Story, philosophy, pillars, standards, write-for-us CTA |
| `/article/:slug` | Article | Standard + Research variant (source line, abstract, key findings, citation, references, "read the original"). Ratings (one per reader), author-controlled comments with replies, save, metered subscribe prompt after 3 reads for signed-out readers |
| `/explore/:pillar` | Explore | Pillar feed with search and format chips (Article · Interviews · Reviews · News · Research) |
| `/research` | Research search | Typeahead (pieces / authors / topics), Field, Type, Source, Date range, Author role, Verified-only, 4 sort modes, removable filter chips, loading + empty states |
| `/opportunities` | Directory | Search, type chips, 6 filter groups, 3 sorts, sponsored-first, loading + empty |
| `/opportunities/:id` | Detail | Facts panel, external Enter / Apply |
| `/opportunities/new` | Submit | Organiser form → moderation queue |
| `/creator/:name` | Portfolio | Public profile, available-for-work, stats, pinned + filterable work, follow |
| `/account` | Account | One account: Reader layer for all + Creator layer when verified; saved, recently read, following, sign out |
| `/workspace` | Writer workspace | Creator-only (guarded). Stats, pieces by status, available-for-work toggle, bio |
| `/write` | Write | Gated: signed out → sign in · reader → verify · creator → editor (pillar, format / research type, body word count, required AI-use disclosure, comments toggle) |
| `/verify` | Verification | Points, levels, step actions (samples, reference, role check, credential) |
| `/subscribe` | Subscribe | Email sign-up, Free + Pro (coming soon) tiers |
| `/signin` | Sign in / Create account | Returns to `?returnTo=` |

## Account model
- Every sign-up is a **reader** (`level 0`): read, save, history, follow.
- A **creator** is a reader with `level >= 1` after verification. Creator tools are added on top; reader features remain.
- Guards: `signedInGuard` (account, verify), `creatorGuard` (workspace → redirects readers to /verify). The API enforces the same rules (`requireUser`, `requireCreator`).

## API (Express)

```
GET  /api/home
GET  /api/articles?pillar=&format=&q=
GET  /api/articles/:slug                     (also serves research pieces; records reading history when signed in)
POST /api/articles/:slug/rating {value}      auth
POST /api/articles/:slug/comments {text, parentId?}   auth, only if comments enabled
PATCH /api/articles/:slug/comments-enabled {enabled}  author only
GET  /api/research?q=&field=&type=&source=&role=&date=any|last-year|last-3-years|custom&from=&to=&verified=true&sort=recent|relevant|cited|picks
GET  /api/research/suggest?q=
GET  /api/opportunities?q=&type=&status=&fee=&who=&format=&prize=&field=&sort=closing|newest|prize
GET  /api/opportunities/:id
POST /api/opportunities                      → status "Pending review"
GET  /api/creators/:name
POST /api/subscribe {email}
POST /api/auth/signup | /api/auth/signin | /api/auth/signout
GET  /api/me · /api/me/saved · /api/me/history · /api/me/following
POST /api/me/saved · /api/me/following       (toggle)
GET  /api/me/workspace · PATCH /api/me/profile · POST /api/submissions        creator only
GET  /api/me/verification · POST /api/me/verification/:step
POST /api/admin/verification/:userId/approve  (editor action, unprotected in this demo)
```

## Design tokens (`client/src/styles.scss`)
Colour is functional; the same colour always means the same thing.

| Token | Hex | Meaning |
|---|---|---|
| `--ink` | #141414 | Text, rules, primary buttons |
| `--paper` / `--stone` | #FAF9F6 / #F0EDE6 | Page / panels |
| `--hairline` | #DCD8CF | Dividers |
| `--graphite` | #5C5A55 | Metadata |
| `--blue` | #1F4F8A | Links, controls, active chips, reader layer |
| `--purple` | #5B3A8C | Creators: verified badge, roles, portfolio, workspace, verification |
| `--pink` | #C2306F | Primary call to action only (Subscribe, Submit) |
| `--amber` | #9A5B00 | Opportunities (promotional layer) |
| `--research-ink` | #16171A | Research band on home |

Type: **Newsreader** (headlines, body, serif) · **Instrument Sans** (UI, labels, Opportunities headings) · **IBM Plex Mono** (data, citations, labels). Body copy 20/1.65 at a 680px measure; never coloured.

## Before production
This is a functional starter, not hardened production code:
- Replace the in-memory store with a database; data resets on restart.
- Hash passwords (bcrypt/argon2), use httpOnly cookie sessions or JWT, add rate limiting and CSRF protection.
- Add an editor/admin role for moderation and verification approval.
- Real image uploads/storage (the UI shows labelled placeholders where photos go).
- Rich-text editor for the Write body (currently a plain textarea).
- Tests, SSR (Angular Universal) for SEO, and accessibility audit.
