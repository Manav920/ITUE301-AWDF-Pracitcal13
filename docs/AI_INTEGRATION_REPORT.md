# Practical 13: AI API Integration into a Web Application
## Academic Viva Report & Technical Analysis

**Course**: Advanced Web Development Frameworks (ITUE301)  
**Student Name**: Manav Lathiya  
**Student ID**: 24CS048  
**Department**: Computer Science and Engineering  
**Institute**: Chandubhai S. Patel Institute of Technology (CSPIT), CHARUSAT  
**Date**: October 2026  
**Repository**: [24CS048Manav/ITUE301-AWDF_Practical13](https://github.com/24CS048Manav/ITUE301-AWDF_Practical13)

---

## 1. Executive Summary & Objective

The objective of Practical 13 is to securely integrate an external AI service (**Google Gemini API**) into our full-stack Task Management application while demonstrating responsible AI principles, server-side secret isolation, and graceful failure degradation.

Rather than exposing API credentials in browser network requests or depending rigidly on third-party uptime, the system employs an Express backend proxy route (`POST /api/ai/generate-description`). If the Gemini API experiences network latency, rate exhaustion, or an invalid/missing API key, the system intercepts the exception and serves a structured heuristic fallback description, ensuring zero disruptions to the core task creation workflow.

---

## 2. System Architecture & Information Flow

```
+-------------------------------------------------------------------------+
|                           REACT FRONTEND (Vite)                         |
|  - User inputs Task Title: "Build Docker Multi-Stage Container"        |
|  - Clicks: "✨ Generate with Gemini AI"                                  |
|  - Shows active loading spinner & enforces 30s client cooldown          |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP POST /api/ai/generate-description
                                     | Body: { title: "..." }
                                     v
+------------------------------------+------------------------------------+
|                          EXPRESS BACKEND (Node.js)                      |
|  1. Intercepts request & checks Rate Limiter (30s window per client)    |
|  2. Reads GEMINI_API_KEY exclusively from server-side .env              |
|  3. Prepares structured engineering prompt with system instructions     |
|                                                                         |
|  +-----------------------------+     +-------------------------------+  |
|  | Normal Path (Valid Key)     |     | Graceful Failure Path         |  |
|  | - Calls Gemini 1.5 Flash    |     | - Key missing/invalid/timeout |  |
|  | - Extracts parsed suggestion|     | - Catches error seamlessly    |  |
|  | - Attaches AI disclaimer    |     | - Heuristic template generated|  |
|  +--------------+--------------+     +---------------+---------------+  |
+-----------------|------------------------------------|------------------+
                  |                                    |
                  +-----------------+------------------+
                                    |
                                    | 200 OK JSON { description, suggestedPriority, fallback, disclaimer }
                                    v
+-----------------------------------+-------------------------------------+
|                           REACT UI PRESENTATION                         |
|  - Populates editable description textarea (user has final edit authority)|
|  - Sets suggested priority level (low / medium / high)                 |
|  - Displays prominent Responsible AI disclaimer banner                 |
+-------------------------------------------------------------------------+
```

---

## 3. Analysis & Key Questions (Rubrics & Viva Reference)

### Q1: Why must the AI API key be called from the backend rather than directly from the React frontend?
* **Secret Leakage Prevention**: Frontend React code is transpiled and executed directly on the client machine. Any environment variable prefixed with `VITE_` or embedded in client bundles can be inspected via Browser DevTools (`Sources` or `Network` tabs).
* **Cost & Quota Protection**: If a malicious user extracts an API key from frontend network requests, they can hijack the quota or run thousands of unauthorized requests, exhausting tier limits or incurring financial costs.
* **Request Sanitization & Prompt Injection Control**: Calling the AI from an Express backend allows the server to sanitize prompts, enforce rate limiting, log interactions, and validate incoming titles before dispatching them to Gemini.
* **CORS & Provider Compatibility**: Direct client-to-API calls frequently run into CORS restrictions and require exposing client-side credentials.

### Q2: What does 'graceful degradation' mean in this context, and why does it matter for a feature that depends on a third-party service outside your control?
* **Definition**: Graceful degradation is a software resilience design pattern where an application continues to provide essential functionality even when non-critical subsidiary services (such as third-party AI APIs) fail or encounter unexpected errors.
* **Why it matters**: Third-party APIs are subject to internet outages, upstream latency spikes, quota limits (HTTP 429), and configuration errors.
* **Implementation in Practical 13**:
  1. The AI generation route wraps external calls in `try/catch` and checks whether `GEMINI_API_KEY` is present.
  2. If the key is missing or the external call throws an error, the backend catches the failure and immediately returns `fallback: true` with an intelligent local heuristic template.
  3. The core Task Management application **never crashes**, never returns an unhandled HTTP 500, and allows the user to continue writing, modifying, and saving tasks without interruption.

### Q3: What are the privacy and governance implications of sending task data to an external AI API, and what kind of data should never be sent this way?
* **Data Privacy Risks**: External foundation model providers may log API prompts for telemetry, quality assurance, or training unless enterprise Zero Data Retention agreements are executed.
* **Prohibited Data Categories**:
  - **Personally Identifiable Information (PII)**: Passwords, social security numbers, student records, phone numbers, or residential addresses.
  - **Proprietary Credentials**: API keys, database credentials, server certificates, and private tokens.
  - **Internal Network Infrastructure**: Server IP addresses, internal VPC hostnames, or confidential architecture maps.
  - **Regulated Data**: Financial credit card numbers (PCI-DSS) or medical health data (HIPAA).
* **Governance Mitigation**:
  - Implement prompt filtering to scrub emails or credentials.
  - Enforce user consent with a prominent UI disclaimer stating: *"Suggestions are AI-generated and must be reviewed prior to task submission."*

---

## 4. Supplementary Problems Implementation

| Supplementary Problem | Requirement | Implementation in Code |
| :--- | :--- | :--- |
| **Supplementary 1** | Add a loading state on the frontend while waiting for the AI response | Pulsing loading spinner rendered on the button with text `Generating AI Suggestion...` and form controls disabled while `aiGenerating === true`. |
| **Supplementary 2** | Add a rate limit (max 1 AI request per task per minute) to avoid excessive API usage | Backend sliding window rate limiter in `aiService.js` (30s cooldown per client/IP) returning HTTP 429 and countdown timer in React UI. |
| **Supplementary 3** | Display a clear disclaimer in the UI noting content is AI-generated | Visual alert banner rendered below description input and inside `AIMonitor.jsx` with full user editability. |

---

## 5. Automated Verification & Test Coverage

All 9 automated Jest and Supertest integration tests passed:
- `GET /`: Validates server metadata and Student ID `24CS048`.
- `GET /health`: Verifies microservice health and AI service readiness.
- `GET /events/history`: Validates decoupled event listener telemetry.
- `GET /tasks`: Enforces 401 Unauthorized guard on protected endpoints.
- `GET /undefined`: Validates 404 handler.
- `POST /api/ai/generate-description`: Validates 200 OK with description, priority, and disclaimer.
- `POST /api/ai/generate-description` (Validation): Verifies 400 Bad Request on missing title.
- `POST /api/ai/generate-description` (Graceful Fallback): Verifies 0 crashes when key is unconfigured.
- `POST /api/ai/generate-description` (Rate Limiting): Verifies HTTP 429 when consecutive calls are made within cooldown.
