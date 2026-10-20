# Practical 13: AI API Integration into a Web Application

[![CI Pipeline](https://github.com/24CS048Manav/ITUE301-AWDF_Practical13/actions/workflows/ci.yml/badge.svg)](https://github.com/24CS048Manav/ITUE301-AWDF_Practical13/actions/workflows/ci.yml)

**Course**: Advanced Web Development Frameworks (ITUE301)  
**Department**: Department of Computer Science and Engineering  
**Institute**: Chandubhai S. Patel Institute of Technology (CSPIT), CHARUSAT  
**Academic Year**: 2025–2026  
**Student Name**: Manav Lathiya  
**Student ID**: 24CS048  
**GitHub Repository**: [24CS048Manav/ITUE301-AWDF_Practical13](https://github.com/24CS048Manav/ITUE301-AWDF_Practical13)

---

## 🎯 Practical Objective
To integrate an external AI service (**Google Gemini API**) into the full-stack Task Management application while demonstrating responsible AI principles, server-side credential isolation, graceful failure handling, rate limiting, and editable client-side suggestions.

---

## 🔑 Where to Put Your Gemini API Key

> **IMPORTANT**: The API key is stored **strictly server-side** in `backend/.env` and is **never** committed to Git or exposed in browser network requests.

1. Open the backend environment file:
   ```
   c:\Users\Anisha\Desktop\Manav\24CS048\AWDF\Prac13\backend\.env
   ```
2. Locate the line:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Replace `your_gemini_api_key_here` with your active Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey):
   ```env
   GEMINI_API_KEY=AIzaSyYourActualKeyHere123456789
   ```
4. Save the file.
5. Restart the backend: `npm run dev` in `backend/`.

*(Note: Even without a key, the application uses **Graceful Degradation** to automatically generate local heuristic templates so your workflow never crashes!)*

---

## 🏗️ System Architecture

```
React Frontend (Vite)
  │
  │ 'Generate description' click (Task title provided)
  ▼
Express Backend (/api/ai/generate-description)
  │
  ├── 1. Rate Limiter (30s cooldown per client/IP)
  ├── 2. GEMINI_API_KEY stored server-side only (.env)
  │
  ▼
Google Gemini API (gemini-1.5-flash)
  │
  ├── On Success: Parses structured description + priority
  └── On Failure / Missing Key: Catches error → returns fallback heuristic
  │
  ▼
Response sent back to React → populated in editable form field with AI disclaimer
```

---

## 🚀 Running Locally

### 1. Backend Server (Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Application (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### 3. Automated Tests (Jest & Supertest)
```bash
cd backend
npm test
```

---

## 📋 Features Implemented

1. **Google Gemini Integration**: Server-side proxy route `POST /api/ai/generate-description` using `@google/generative-ai` (`gemini-1.5-flash`).
2. **Graceful Degradation**: If the API key is missing or invalid, or if the network times out, the backend catches the error and generates an offline heuristic fallback template.
3. **Editable Suggestions**: The AI response is pre-filled into an editable textarea, giving the user complete editorial control.
4. **Supplementary Problem 1**: Visual loading state with pulsing spinner while waiting for the AI response.
5. **Supplementary Problem 2**: Rate limiting (30s sliding window) returning HTTP 429 to avoid excessive API usage.
6. **Supplementary Problem 3**: Visible disclaimer in the UI stating that suggestions are AI-generated and must be reviewed.
7. **AIMonitor Sandbox**: Dedicated interactive component for testing prompts, inspecting latency, and viewing governance policies.

---

## 📸 Recommended Screenshots for Lab Submission

| # | Screenshot Target | What to Capture / URL | Description / Caption |
| :---: | :--- | :--- | :--- |
| **1** | **Backend .env Configuration** | `backend/.env` in VS Code / Editor | Shows `GEMINI_API_KEY` configured securely on the server-side without being committed to Git (`.gitignore`). |
| **2** | **Task Form & AI Generate Button** | `http://localhost:5173/tasks` | Task creation form showing task title and the "✨ Generate with Gemini AI" button with pulsing loading indicator. |
| **3** | **AI Suggestion & Disclaimer Banner** | `http://localhost:5173/tasks` | Editable description populated with Gemini AI suggestion, priority set, and visible Responsible AI disclaimer. |
| **4** | **Rate Limiter Cooldown** | `http://localhost:5173/tasks` | Clicking generate again within 30s displays the rate limit warning and countdown timer (`Rate Limit (28s)`). |
| **5** | **Graceful Degradation Test** | `http://localhost:5173/tasks` | Testing with invalid/missing key shows the offline fallback template banner without crashing the application. |
| **6** | **AI Architecture & Governance Monitor** | `http://localhost:5173/tasks` (AIMonitor) | Shows the Interactive AI Sandbox, latency metrics, and Data Governance compliance checklist. |
| **7** | **Automated Test Suite (Jest)** | Terminal: `npm test` in `backend/` | Terminal output showing all 9 integration tests passing (including AI generation, rate limiting, and fallback). |
| **8** | **GitHub Actions CI/CD Run** | GitHub Actions Tab in Repo | Green workflow run confirming automated linting and test execution on push. |
