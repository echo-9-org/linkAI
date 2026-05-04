Technical Specification Supplement: Project Echo-Link
1. Advanced Scheduling Logic: "The Demo Gatekeeper"
The system must prioritize specific recurring windows for product demonstrations to ensure team alignment and operational efficiency.
•	Preferred Demo Windows:
o	Monday: 14:00 – 16:00 BST
o	Thursday: 14:00 – 16:00 BST
•	Logic Flow for Demos:
1.	Intent Detection: If the LLM identifies a request for a "Demo," "Walkthrough," or "GLPI Showcase," it must first cross-reference the calendarView specifically for the preferred Monday/Thursday blocks.
2.	Conflict Handling:
	If the preferred slot is open: Propose the slot and create a Tentative event.
	If the preferred slot is taken: The system must check the next available preferred window (e.g., if Monday is full, check Thursday).
	Escalation: Only if the next two preferred windows are full should the system look for "General" free time, adding a disclaimer to the draft: "Proposed outside standard demo windows due to schedule density."
3.	Coordination: Ensure the meeting invite includes a standardized GLPI Demo bridge link or location.
2. "Human-in-the-Loop" Response Protocol
To maintain executive oversight, the system is strictly prohibited from sending external correspondence.
•	Drafting Mechanism: Use POST /me/messages to create a message in the Drafts folder rather than using the send endpoint.
•	Metadata Tagging: Each draft should begin with a hidden or bracketed prefix (e.g., [AI DRAFT]) to distinguish it from manual drafts.
•	Context Injection: The LLM should be prompted to include "Next Steps" at the top of the draft body for the user to review before hitting send.
3. Inbox Hygiene: Automated Unsubscribe Module
The system will act as an active filter for low-value marketing content that does not align with CEO-level strategy or Echo-9’s core business.
•	Identification:
o	Header Analysis: Scan for List-Unsubscribe headers in incoming mail.
o	Role-Relevance Filter: The LLM must evaluate if the sender is a known contact/client or a generic marketing blast. If the content is "Noise" (e.g., generic retail offers, irrelevant tech newsletters), it is flagged.
•	Action Execution:
1.	Direct Unsubscribe: The system should attempt to programmatically trigger the List-Unsubscribe URI or mailto link.
2.	Cleanup: Once the unsubscribe action is triggered, the system should move the email to the "Archive" or "Deleted Items" folder to keep the primary inbox focused on active GLPI integrations and business development.
________________________________________
Updated Developer Task List (Additions)
•	Task 6: Implement a "Constraint-Based Scheduler" that maps the Monday/Thursday 14:00-16:00 blocks as HighPriority_Slot for demo intents.
•	Task 7: Configure the Graph API integration to use the Drafts endpoint exclusively for outbound text.
•	Task 8: Develop a "Sweep" function that identifies emails with List-Unsubscribe headers and runs a "Role-Relevance" check before execution.
•	Task 9: Create a log for the CEO to review: "Unsubscribed you from [Newsletter Name] as it appeared irrelevant to Echo-9 operations."
