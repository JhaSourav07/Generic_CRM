# Vynexa CRM — Official Copy & Content Guide (COPY_GUIDE.md)

This document establishes the official writing, terminology, and microcopy standards for **Vynexa CRM**. All user-facing text—including navigation labels, page headers, metric cards, table headers, form inputs, tooltips, dialogs, empty states, and toast alerts—must strictly follow these guidelines.

---

## 1. Core Writing Principles

1. **Clear, Human, and Direct**
   - Write like a thoughtful human professional speaking directly to a busy colleague.
   - Favor short words and direct sentences over high-flown corporate jargon or overly casual slang.
   - Example: *"Updates on your leads, deals, tasks, and team activity"* instead of *"Real-time cross-module notification streams and operational alerts"*.

2. **No Developer or Database Jargon in the UI**
   - Everyday business users do not care about database mechanics, ORM abstractions, or storage primitives.
   - Never show terms like `UUID`, `PostgreSQL`, `Storage Key`, `append-only`, `mutation`, `atomic transaction`, or raw enum constants (e.g., `TASK_ASSIGNED`).
   - Use plain business language: *"File ID"*, *"Date created"*, *"Save changes"*, *"Task assigned"*.

3. **Sentence Case Everywhere**
   - Use sentence case for page titles, headings, card headers, table headers, form labels, and buttons.
   - Only capitalize the first word and proper nouns/acronyms (e.g., *CRM*, *USD*, *PDF*).
   - Correct: *"Expected sales"*, *"Pipeline value"*, *"Target close date"*, *"Assigned to"*.
   - Incorrect: *"Expected Sales"*, *"Pipeline Value"*, *"Target Close Date"*, *"Assigned To"*.

4. **Active Action Verbs for Buttons & CTAs**
   - Every primary action button must start with an active verb describing what happens when clicked.
   - Use concise formulas: `[Verb] [Noun]`.
   - Examples: *"Add lead"*, *"Create quote"*, *"Convert lead"*, *"Schedule follow-up"*, *"Save changes"*, *"Upload document"*.

5. **Clarity Over Cleverness**
   - Avoid buzzwords, empty marketing fluff, and artificial AI-sounding prose.
   - No exclamation points in routine system messages (e.g., *"Changes saved"* instead of *"Awesome! You did it! 🎉"*).

---

## 2. Terminology Dictionary (Before & After)

| Internal / Deprecated Term | Recommended Customer-Facing Term | Context & Application |
|---|---|---|
| Account / Customer Account | **Customer** | Companies and organizations doing business with the tenant. |
| Opportunity / Commercial Opportunity | **Deal** | Sales opportunities being tracked in the pipeline. |
| Pipeline Stage Entity | **Stage** | Sales stages within a pipeline. |
| Expected Monetary Value / Forecast Value | **Expected sales** | Value weighted by probability (`value * probability`). |
| Pipeline Velocity / Total Deal Corpus | **Pipeline value** | Total sum of open opportunities in a pipeline. |
| Ingestion Date / Timestamp | **Date created** | When a record was created in the CRM. |
| Storage Key / S3 Object Key | **File ID** | External reference for uploaded documents. |
| Support Case Incident / Ticket | **Support request** | Customer support tickets and issues. |
| Audit Trail / Append-only Event Stream | **Audit log** | Tamper-proof history of actions and security events. |
| Atomic Conversion Workflow | **Convert lead** | Transitioning a qualified lead into customer, contact, and deal. |
| Initial Owner / Assignee Context | **Assigned to** | The team member responsible for a record. |
| Target Close Date / Anticipated Settlement | **Target close date** | Expected closing date for a sales deal. |
| Line Item Recalculation Engine | **Line items** | Products and services included in a quote or order. |
| Catalog Item SKU / Stock Unit | **Product / SKU** | Products or services in the catalog. |
| Marketing Campaign Attribution | **Campaign** | Marketing campaigns and lead source tracking. |
| Execution Duration | **Duration** | Length of a meeting or phone call in minutes. |
| System User Record | **Team member** or **User** | Accounts belonging to colleagues and teammates. |

---

## 3. Words & Phrases to Avoid

| Strictly Prohibited | Plain English Replacement |
|---|---|
| "Streamline your workflows" | "Organize your work" / "Manage your team" |
| "Synergize / Synergistic" | "Coordinate" / "Work together" |
| "Atomic transaction" | "Conversion" / "Action" |
| "PostgreSQL / DB mutation" | "Save" / "Update" / "Record" |
| "Storage key / Object URI" | "File ID" / "Document path" |
| "Append-only tamper-proof ledger" | "Permanent audit log" |
| "Execution payload" | "Details" / "Parameters" |
| "De-duplication / Ingestion" | "Import" / "Capture" |
| "Deep-dive analytics" | "Reports" / "Performance summary" |
| "Commercial quotation proposal" | "Quote" |
| "Incident ticket" | "Support request" |
| "Let's boost sales 🚀" | Keep copy grounded and professional |

---

## 4. Action Button Formulas

Standard action buttons must follow predictable patterns:

- **Adding new records**:
  - `Add lead`
  - `Add customer`
  - `Add contact`
  - `Add deal`
  - `Add product`
  - `Add task`
  - `Add campaign`
  - `Log activity`
  - `Create quote`
  - `Create order`
  - `Upload document`
  - `Add support request`

- **Editing & modifying**:
  - `Save changes`
  - `Update status`
  - `Assign lead` / `Assign deal` / `Assign task`
  - `Change stage`
  - `Mark as won` / `Mark as lost`
  - `Convert lead`
  - `Resolve request` / `Close request`

- **Destructive & dismissive actions**:
  - `Cancel`
  - `Delete`
  - `Deactivate user`
  - `Archive`

---

## 5. Empty State Message Formulas

Empty states must reassure the user and provide a clear immediate next step.

**Pattern**:
1. **Headline**: State clearly what is missing (sentence case, 3–5 words).
2. **Subheadline**: Explain what will appear here once activity starts (1 brief sentence).
3. **CTA Button**: Provide the primary creation action.

### Approved Examples
- **Leads**:
  - Headline: *"No leads found"*
  - Body: *"Get started by adding your first sales lead or adjusting your search filters."*
  - Action: `[Add lead]`
- **Deals / Pipeline**:
  - Headline: *"No deals in this stage"*
  - Body: *"Drag deals here or create a new deal to start tracking."*
  - Action: `[Add deal]`
- **Tasks**:
  - Headline: *"No tasks found"*
  - Body: *"You have no pending tasks scheduled. Create one to stay organized."*
  - Action: `[Add task]`
- **Notifications**:
  - Headline: *"You're all caught up"*
  - Body: *"Updates about your leads, deals, and tasks will appear here."*
- **Documents**:
  - Headline: *"No documents uploaded yet"*
  - Body: *"Upload contracts, proposals, or receipts to keep them organized with this record."*
  - Action: `[Upload document]`

---

## 6. Feedback & Confirmation Modal Patterns

### Toast Notifications
- Keep toasts concise: Title (2–3 words) + optional one-line detail.
- Examples:
  - Success: `Lead added` — `"Sarah Connor has been added to your leads."`
  - Success: `Deal won` — `"'Acme Expansion' marked as won."`
  - Success: `Quote updated` — `"Draft quote saved successfully."`
  - Error: `Could not save changes` — `"Please check required fields and try again."`
  - Warning: `Lead already converted` — `"This lead was already converted to a customer."`

### Confirmation Modals (Destructive Actions)
- Always specify the exact entity name in the warning prompt.
- Pattern:
  - Title: *"Delete [item name]?"*
  - Body: *"Are you sure you want to delete [Item Name]? This action cannot be undone."*
  - Buttons: `[Cancel]` (outline) and `[Delete]` (danger).

---

*This guide is binding for all current and future frontend code developed for Vynexa CRM.*
