import express from 'express';
import cors from 'cors';
import content from './routes/content.js';
import opportunities from './routes/opportunities.js';
import account from './routes/account.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:4200' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', content);
app.use('/api/opportunities', opportunities);
app.use('/api', account);

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('TechIsArt API on http://localhost:' + port));
