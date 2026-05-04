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
4. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

## Local Development (WSL/Linux)
The service runs on port `3000` by default. To receive Webhooks from Microsoft Graph locally, you may need a tool like `ngrok` to expose your local port to the internet.

```bash
ngrok http 3000
```
Update your `REDIRECT_URI` and Webhook Notification URL with the ngrok address.
