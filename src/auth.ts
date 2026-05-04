import * as msal from '@azure/msal-node';
import { getDb } from './db';
import dotenv from 'dotenv';

dotenv.config();

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID || 'common'}`,
        clientSecret: process.env.CLIENT_SECRET || '',
    }
};

const pca = new msal.ConfidentialClientApplication(msalConfig);

export async function getAuthUrl() {
    const authCodeUrlParameters = {
        scopes: ["user.read", "mail.readwrite", "calendars.readwrite"],
        redirectUri: process.env.REDIRECT_URI || "http://localhost:3000/auth/callback",
    };

    return pca.getAuthCodeUrl(authCodeUrlParameters);
}

export async function acquireTokenByCode(code: string) {
    const tokenRequest = {
        code: code,
        scopes: ["user.read", "mail.readwrite", "calendars.readwrite"],
        redirectUri: process.env.REDIRECT_URI || "http://localhost:3000/auth/callback",
    };

    const response = await pca.acquireTokenByCode(tokenRequest);
    
    if (response && response.accessToken) {
        const db = await getDb();
        const expiresAt = Date.now() + (response.expiresOn ? response.expiresOn.getTime() - Date.now() : 3600000);
        
        // Store the token in our auth_state table (id=1 for single user service)
        await db.run(`
            INSERT OR REPLACE INTO auth_state (id, access_token, refresh_token, expires_at)
            VALUES (1, ?, ?, ?)
        `, [response.accessToken, response.uniqueId, expiresAt]);
        
        return response.account;
    }
    
    throw new Error('Authentication failed: No access token received.');
}
