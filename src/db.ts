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
            score INTEGER,
            urgency TEXT,
            recommended_response TEXT,
            suggested_event TEXT,
            status TEXT DEFAULT 'PENDING'
        )
    `);

    // Migration: Add suggested_event column
    try {
        await db.run('ALTER TABLE action_items ADD COLUMN suggested_event TEXT');
    } catch (e) {}

    // Migration: Add urgency column if it doesn't exist
    try {
        await db.run('ALTER TABLE action_items ADD COLUMN urgency TEXT DEFAULT "Flexible"');
    } catch (e) {}

    // Migration: Add score column if it doesn't exist
    try {
        await db.run('ALTER TABLE action_items ADD COLUMN score INTEGER');
    } catch (e) {
        // Column already exists, ignore
    }

    // Create priority rules table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS priority_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rank INTEGER,
            category TEXT,
            description TEXT
        )
    `);

    // Insert default rules if empty
    const rules = await db.all('SELECT * FROM priority_rules');
    if (rules.length === 0) {
        await db.run('INSERT INTO priority_rules (rank, category, description) VALUES (1, "High", "Direct requests from clients, critical bugs, or immediate meeting requests")');
        await db.run('INSERT INTO priority_rules (rank, category, description) VALUES (2, "Medium", "Internal updates, non-urgent information requests, or general business dev")');
        await db.run('INSERT INTO priority_rules (rank, category, description) VALUES (3, "Low", "Newsletters, FYIs, or generic community updates")');
    }

    // Create app settings table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    // Create contacts table for priority management
    await db.exec(`
        CREATE TABLE IF NOT EXISTS contacts (
            email TEXT PRIMARY KEY,
            name TEXT,
            is_priority INTEGER DEFAULT 0,
            is_domain INTEGER DEFAULT 0,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Default settings
    await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES ("llm_provider", "openai")');
    await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES ("openai_api_key", "")');
    await db.run('INSERT OR IGNORE INTO settings (key, value) VALUES ("gemini_api_key", "")');

    console.log('Database initialized with Priority Rules, App Settings, and Contacts.');
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
