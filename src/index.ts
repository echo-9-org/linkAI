import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { initDb, logAction } from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
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
