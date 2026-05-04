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

    console.log('Database initialized.');
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
