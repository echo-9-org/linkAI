# LinkAI

**LinkAI** is an intelligent backend service designed for executive-level Outlook productivity. It automates the "noise" of inbox management while enforcing strict scheduling constraints for product demonstrations.

## Key Features

### 1. The Demo Gatekeeper
Enforces high-priority windows for product walkthroughs:
- **Monday: 14:00 – 16:00 BST**
- **Thursday: 14:00 – 16:00 BST**
Automatically drafts meeting proposals for "Demo" intents, checking for calendar conflicts in real-time.

### 2. Human-in-the-Loop Protocol
- Strictly **zero** automated external correspondence.
- All AI responses are created as **Drafts** with an `[AI DRAFT]` prefix.
- Includes context-aware "Next Steps" for executive review.

### 3. Automated Inbox Hygiene
- Programmatically identifies `List-Unsubscribe` headers.
- Uses LLM-based "Role-Relevance" filtering to separate low-value marketing from critical business development.
- Automatically archives unsubscribed noise.

## Technical Architecture
Built on **Node.js/TypeScript** with **Microsoft Graph API**.
- **Persistence**: SQLite (Logs & State)
- **Intelligence**: OpenAI GPT-4o
- **Real-time**: Graph Webhooks

## Getting Started
See [DEVELOPMENT.md](./DEVELOPMENT.md) for setup instructions.

## Documentation
- [Architecture Details](./docs/architecture.md)
- [Security Policy](./SECURITY.md)
- [Roadmap](./TODO.md)

## License
MIT License.
