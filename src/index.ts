import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { initDb, logAction, getDb } from './db';
import { getAuthUrl, acquireTokenByCode } from './auth';
import { runInboxSweep } from './modules/engine';
import { identifyActionItems } from './modules/action_engine';
import { createDraft } from './graph';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Auth Routes
app.get('/login', async (req, res) => {
    try {
        const url = await getAuthUrl();
        res.redirect(url);
    } catch (error) {
        res.status(500).send('Error generating auth URL');
    }
});

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code as string;
    if (!code) return res.status(400).send('No code provided');

    try {
        await acquireTokenByCode(code);
        logAction('Auth', 'Login', 'User successfully authenticated via OAuth2');
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Authentication failed');
    }
});

// API Endpoints for Dashboard
app.get('/api/logs', async (req, res) => {
    const db = await getDb();
    const logs = await db.all('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 10');
    res.json(logs);
});

app.get('/api/stats', async (req, res) => {
    const db = await getDb();
    const unsubscribes = await db.get('SELECT COUNT(*) as count FROM unsubscribes');
    const demos = await db.get('SELECT COUNT(*) as count FROM demo_proposals');
    const drafts = await db.get('SELECT COUNT(*) as count FROM logs WHERE action = "Proposal"');
    
    res.json({
        unsubscribes: unsubscribes?.count || 0,
        demos: demos?.count || 0,
        drafts: drafts?.count || 0
    });
});

app.post('/api/sweep', async (req, res) => {
    try {
        const sinceDays = req.body.sinceDays || 1;
        const result = await runInboxSweep(sinceDays);
        // Also trigger action item identification
        await identifyActionItems();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/actions', async (req, res) => {
    const db = await getDb();
    const actions = await db.all('SELECT * FROM action_items WHERE status = "PENDING" ORDER BY timestamp DESC');
    res.json(actions);
});

app.post('/api/actions/draft', async (req, res) => {
    const { id } = req.body;
    try {
        const db = await getDb();
        const action = await db.get('SELECT * FROM action_items WHERE id = ?', [id]);
        if (!action) return res.status(404).send('Action not found');

        // Create the draft in Outlook
        await createDraft(`RE: ${action.subject}`, action.recommended_response, []);
        
        // Update status
        await db.run('UPDATE action_items SET status = "DRAFTED" WHERE id = ?', [id]);
        await logAction('Intelligence', 'Draft Saved', `Saved response draft for: ${action.subject}`, 'SUCCESS');
        
        res.json({ status: 'success' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
    console.log('Received notification from Microsoft Graph');
    if (req.query.validationToken) {
        return res.status(200).send(req.query.validationToken);
    }
    res.status(202).send();
});

async function startServer() {
    await initDb();
    app.listen(port, () => {
        console.log(`LinkAI service listening at http://localhost:${port}`);
        logAction('System', 'Startup', `Service started on port ${port}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
