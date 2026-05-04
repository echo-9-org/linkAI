# Core Architecture: LinkAI

## Overview
LinkAI is a backend service designed to enhance Outlook productivity through automated scheduling and inbox hygiene. It operates as a middle-layer between the Microsoft Graph API and the user's mailbox.

## Components

### 1. Messaging Engine (Express)
- Handles incoming Webhooks from Microsoft Graph.
- Manages the OAuth2 callback flow.
- Provides internal health checks and logs.

### 2. Logic Controller
- **Intent Analyzer**: Uses LLMs to categorize incoming mail (e.g., "Demo Request", "Marketing Noise").
- **Constraint-Based Scheduler**: Maps specific business windows (Mon/Thu 14:00-16:00 BST) for automated calendar proposals.
- **Unsubscribe Module**: Extracts `List-Unsubscribe` headers and executes programmatic unsubscribes.

### 3. Integration Layer (Microsoft Graph)
- **Mail API**: Reads incoming messages and creates drafts.
- **Calendar API**: Checks `calendarView` for availability and creates tentative events.

### 4. Data Persistence (SQLite)
- **Logs**: Tracks all AI actions for executive review.
- **State**: Manages subscription IDs and processed message IDs to avoid double-processing.

## Data Flow
1. New Email -> Graph Webhook -> **LinkAI Webhook Endpoint**.
2. **LinkAI** -> LLM Analysis (Intent detection).
3. If **Demo Intent**: Check Calendar -> Create Draft with proposed slot.
4. If **Noise Intent**: Check Unsubscribe Headers -> Execute Unsubscribe -> Move to Archive.
5. All actions logged to **SQLite**.
