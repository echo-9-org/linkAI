import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database;

export async function initDb() {
    db = await open({
        filename: path.join(__dirname, '../linkai.db'),
        driver: sqlite3.Database
    });

    // Create logs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            category TEXT,
            action TEXT,
            details TEXT,
            status TEXT
        )
    `);

    // Create unsubscribed newsletters table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS unsubscribes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            sender_email TEXT,
            newsletter_name TEXT,
            reason TEXT
        )
    `);

    // Create demo proposals table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS demo_proposals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            attendee_email TEXT,
            proposed_slot DATETIME,
            status TEXT DEFAULT 'PENDING'
        )
    `);

    // Create auth state table (for storing tokens securely)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS auth_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            access_token TEXT,
            refresh_token TEXT,
            expires_at INTEGER
        )
    `);

    // Create action items table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS action_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            conversation_id TEXT UNIQUE,
            subject TEXT,
            summary TEXT,
            priority TEXT,
            recommended_response TEXT,
            status TEXT DEFAULT 'PENDING'
        )
    `);

    console.log('Database initialized with Action Items schema.');
}

export async function logAction(category: string, action: string, details: string, status: string = 'INFO') {
    await db.run(
        'INSERT INTO logs (category, action, details, status) VALUES (?, ?, ?, ?)',
        [category, action, details, status]
    );
}

export async function getDb() {
    if (!db) await initDb();
    return db;
}
