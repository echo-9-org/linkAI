# Development Environment Setup

## Prerequisites
- **Node.js**: v18 or higher (v20 recommended).
- **Git**: Installed and configured.
- **Azure Account**: For Microsoft Graph API access.

## Quick Start
1. **Clone the repo**:
   ```bash
   git clone git@github.com:echo-9-org/linkAI.git
   cd linkAI
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   - Copy `.env.example` to `.env`.
   - Fill in your `CLIENT_ID`, `TENANT_ID`, and `CLIENT_SECRET` from the Azure Portal.
    ```bash
    npm run dev
    ```

## Azure App Registration Setup
1. Go to the [Azure Portal](https://portal.azure.com) > **Microsoft Entra ID** > **App registrations**.
2. Click **New registration**:
   - Name: `LinkAI`
   - Supported account types: **Accounts in this organizational directory only**.
   - Redirect URI: Web -> `http://localhost:3000/auth/callback` (or your ngrok URL).
3. Under **Certificates & secrets**:
   - Create a new **Client Secret**. Copy the **Value** (not the ID) immediately.
4. Under **API permissions**:
   - Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**.
   - Select: `User.Read`, `Mail.ReadWrite`, `Calendars.ReadWrite`.
   - Click **Add permissions**.
5. Copy the **Application (client) ID** and **Directory (tenant) ID** from the **Overview** tab.

## Local Development (WSL/Linux)
The service runs on port `3000` by default. To receive Webhooks from Microsoft Graph locally, you may need a tool like `ngrok` to expose your local port to the internet.

```bash
ngrok http 3000
```
Update your `REDIRECT_URI` and Webhook Notification URL with the ngrok address.
