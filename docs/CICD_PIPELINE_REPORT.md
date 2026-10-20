# Practical 12: CI/CD Pipeline with GitHub Actions
**Course**: Advanced Web Development Frameworks (ITUE301)  
**Student**: Manav Lathiya (ID: 24CS048)  
**Department**: Department of Computer Science & Engineering, CSPIT, CHARUSAT  
**Repository**: [24CS048Manav/ITUE301-AWDF_Practical12](https://github.com/24CS048Manav/ITUE301-AWDF_Practical12)  
**Pipeline Status**: [![CI Pipeline](https://github.com/24CS048Manav/ITUE301-AWDF_Practical12/actions/workflows/ci.yml/badge.svg)](https://github.com/24CS048Manav/ITUE301-AWDF_Practical12/actions/workflows/ci.yml)

---

## 1. Practical Overview & Objectives
- **Course Outcome (CO)**: CO5 / PO3, PO5
- **Objective**: To automate static code analysis, dependency installation, and end-to-end automated testing using a Continuous Integration (CI) pipeline powered by GitHub Actions.
- **Key Deliverables**:
  - Declarative `.github/workflows/ci.yml` workflow.
  - Multi-job pipeline (`lint` job + `build-and-test` job).
  - Automated Jest + Supertest suite with 5 integration tests.
  - Verification of both a deliberately failing pipeline (Red X) and a resolved pipeline (Green Checkmark).

---

## 2. CI/CD Architecture & Pipeline Flow

```
                 GIT COMMIT & PUSH TO MAIN / PULL REQUEST
                                   │
                                   ▼
                   GitHub Actions Event Trigger (on: push / PR)
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │            Job 1: LINT AUDIT              │
             │           (ubuntu-latest, Node 20)        │
             ├───────────────────────────────────────────┤
             │ 1. Checkout Repository (actions/checkout) │
             │ 2. Setup Node.js (actions/setup-node)     │
             │ 3. Clean Install (npm ci)                 │
             │ 4. Run Static Code Lint (npm run lint)    │
             └─────────────────────┬─────────────────────┘
                                   │
                                   ▼ (needs: lint must pass)
             ┌───────────────────────────────────────────┐
             │       Job 2: BUILD & AUTOMATED TESTS      │
             │           (ubuntu-latest, Node 20)        │
             ├───────────────────────────────────────────┤
             │ 1. Checkout Repository (actions/checkout) │
             │ 2. Setup Node.js 20 with npm caching      │
             │ 3. Install Dependencies (npm ci)          │
             │ 4. Run Automated Test Suite (npm test)    │
             │ 5. Generate Execution Report              │
             └─────────────────────┬─────────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        ▼                     ▼
               ❌ Test Failed         ✅ All Tests Pass
             (Red X on GitHub)      (Green Checkmark on GitHub)
```

---

## 3. Workflow Implementation (`.github/workflows/ci.yml`)

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Code Quality & Lint Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      - name: Install Dependencies
        working-directory: ./backend
        run: npm ci
      - name: Run Linter
        working-directory: ./backend
        run: npm run lint

  build-and-test:
    name: Build & Automated Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: 'backend/package-lock.json'
      - name: Install Dependencies
        working-directory: ./backend
        run: npm ci
      - name: Run Tests
        working-directory: ./backend
        run: npm test
        env:
          NODE_ENV: test
          JWT_SECRET: supersecret_ci_test_key_24cs048
```

---

## 4. Automated Test Suite Breakdown (`backend/server.test.js`)

| Test # | Test Name | Endpoint | Expected Result | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Root API Metadata | `GET /` | Status `200 OK`, JSON has student ID | Verifies core Express server routing & metadata |
| **2** | Container Health Check | `GET /health` | Status `200` or `503`, JSON has service status | Validates microservice health probe (Student Assignment) |
| **3** | Event History Stream | `GET /events/history` | Status `200 OK`, array of events | Confirms EventEmitter telemetry integration (Prac 10) |
| **4** | Auth Protection Guard | `GET /tasks` | Status `401 Unauthorized` | Ensures unprotected requests are rejected (Prac 7) |
| **5** | Global 404 Handler | `GET /invalid-route` | Status `404 Not Found` | Validates fallback error routing |

### Local Test Execution Output:
```text
PASS ./server.test.js
  Practical 12: CI/CD Automated Test Pipeline
    √ GET / returns 200 and confirms API metadata (743 ms)
    √ GET /health returns 200 or 503 with service health info (143 ms)
    √ GET /events/history returns 200 and event history array (146 ms)
    √ GET /tasks without auth token returns 401 Unauthorized (69 ms)
    √ GET /undefined-route returns 404 Route Not Found (64 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        9.854 s
```

---

## 5. Deliberate Pipeline Failure & Fix Demonstration

### A. Inducing a Deliberate Failure
To demonstrate pipeline failure detection, an intentional mismatch assertion is committed:
```javascript
// Deliberate breaking test:
test('GET / returns 200 and confirms API metadata', async () => {
  const res = await request(app).get('/');
  expect(res.statusCode).toBe(500); // Fails because API returns 200!
});
```
- **Observed Result on GitHub Actions**:
  - Job `build-and-test` exited with code `1`.
  - GitHub displays a prominent **Red X** next to the commit.
  - Pull requests targeting `main` are blocked from merging.

### B. Correcting the Test
Reverting the expected status back to `200`:
```javascript
expect(res.statusCode).toBe(200);
```
- **Observed Result on GitHub Actions**:
  - All 5 tests pass in ~9.8s.
  - Job `build-and-test` exits with code `0`.
  - GitHub displays a **Green Checkmark** and updates the status badge to `passing`.

---

## 6. Answers to Key Analysis Questions (Viva Preparation)

### Q1: What is the difference between Continuous Integration and Continuous Deployment, and which one does this practical actually demonstrate?
> - **Continuous Integration (CI)**: The automated practice of frequently merging code changes into a shared repository, where every push triggers automated build, linting, and testing pipelines to detect regressions immediately.
> - **Continuous Deployment (CD)**: The automated practice of automatically packaging and releasing verified code directly to production environments (e.g. AWS, Render, Docker Hub) without human intervention.
> - **Demonstrated in this Practical**: This practical implements **Continuous Integration (CI)**, verifying code quality through multi-job automated linting and unit/integration testing on push and pull requests.

### Q2: Why does running tests automatically on every push catch problems earlier than testing manually before a release?
> 1. **Immediate Feedback Loop**: Developers are notified within 60 seconds of pushing broken code while context is fresh in their minds, rather than discovering bugs weeks later during release QA.
> 2. **Isolates Culprit Commits**: Because tests run on every discrete commit, the exact commit and code line that introduced the bug is pinpointed immediately via git bisect / GitHub Actions run logs.
> 3. **Eliminates Human Error**: Automated CI pipelines run identically on neutral, clean cloud runners (`ubuntu-latest`), eliminating "it works on my machine" discrepancies.

### Q3: What would happen to the pipeline if the test file path were incorrect — would the workflow fail at the same step as a genuine test failure?
> - **No, it would fail differently**: If the test file path were wrong (e.g., `jest nonexistent.test.js`), Jest exits with code 1 at the runner initialization step with an error like `No tests found matching "nonexistent.test.js"`.
> - A genuine test failure occurs after Jest discovers the file, boots the application, executes the HTTP request, and encounters an assertion error (e.g., `Expected 200, Received 500`).
> - While both result in a non-zero exit code (failing the CI job), the logs clearly distinguish between a **test harness configuration failure** and a **regression defect in application code**.
