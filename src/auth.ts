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
        scopes: ["user.read", "mail.readwrite", "calendars.readwrite", "offline_access"],
        redirectUri: process.env.REDIRECT_URI || "http://localhost:3001/auth/callback",
    };

    return pca.getAuthCodeUrl(authCodeUrlParameters);
}

export async function acquireTokenByCode(code: string) {
    const tokenRequest = {
        code: code,
        scopes: ["user.read", "mail.readwrite", "calendars.readwrite", "offline_access"],
        redirectUri: process.env.REDIRECT_URI || "http://localhost:3001/auth/callback",
    };

    const response = await pca.acquireTokenByCode(tokenRequest);
    
    if (response && response.accessToken) {
        const db = await getDb();
        const expiresAt = response.expiresOn ? response.expiresOn.getTime() : Date.now() + 3600000;
        
        // Account contains the homeAccountId which acts as our link to the refresh token in MSAL's cache
        // But for simplicity in this service, we'll store the account ID to re-acquire tokens
        await db.run(`
            INSERT OR REPLACE INTO auth_state (id, access_token, refresh_token, expires_at)
            VALUES (1, ?, ?, ?)
        `, [response.accessToken, response.account?.homeAccountId, expiresAt]);
        
        return response.account;
    }
    
    throw new Error('Authentication failed: No access token received.');
}

export async function getValidToken() {
    const db = await getDb();
    const auth = await db.get('SELECT * FROM auth_state WHERE id = 1');

    if (!auth) throw new Error('No authentication state found. Please login.');

    // If token is still valid (with 5 min buffer), return it
    if (auth.expires_at > Date.now() + 300000) {
        return auth.access_token;
    }

    console.log('Token expired or near expiry. Attempting silent refresh...');

    // Attempt to acquire token silently
    try {
        const account = await pca.getTokenCache().getAccountByHomeId(auth.refresh_token);
        if (!account) throw new Error('Account not found in cache');

        const silentRequest = {
            account: account,
            scopes: ["user.read", "mail.readwrite", "calendars.readwrite", "offline_access"],
        };

        const response = await pca.acquireTokenSilent(silentRequest);
        if (response && response.accessToken) {
            const expiresAt = response.expiresOn ? response.expiresOn.getTime() : Date.now() + 3600000;
            await db.run('UPDATE auth_state SET access_token = ?, expires_at = ? WHERE id = 1', [response.accessToken, expiresAt]);
            return response.accessToken;
        }
    } catch (error) {
        console.error('Silent token refresh failed:', error);
        throw new Error('Session expired. Please login again at /login');
    }

    throw new Error('Could not refresh token.');
}
