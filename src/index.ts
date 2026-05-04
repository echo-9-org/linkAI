import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { initDb, logAction } from './db';
import { getAuthUrl, acquireTokenByCode } from './auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
        res.send('Authentication successful! You can close this window.');
        logAction('Auth', 'Login', 'User successfully authenticated via OAuth2');
    } catch (error) {
        console.error(error);
        res.status(500).send('Authentication failed');
    }
});

// Placeholder for Graph API Webhook endpoint
app.post('/webhook', (req, res) => {
    console.log('Received notification from Microsoft Graph');
    // Validation token handling for initial setup
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
