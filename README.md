# TaskPilot AI

**From messy requests to clear action.**

TaskPilot AI is an AI-powered project operations assistant that transforms unstructured client briefs into actionable project plans. It helps teams understand client requirements, organize tasks, identify missing information, assess risks, and make project decisions with human oversight.

## Overview

Client requests often arrive as long messages with unclear requirements, missing details, and unrealistic deadlines. TaskPilot AI helps convert these requests into structured project information and actionable next steps.

The application combines AI-assisted planning with task management, dependency-aware scheduling, risk detection, approval workflows, and audit logging.

## Key Features

- **AI-Powered Brief Analysis:** Analyze client briefs and generate structured project insights.
- **Smart Project Planning:** Turn project requirements into actionable tasks.
- **Task Management:** Create, update, complete, and track project tasks.
- **Dependency-Aware Scheduling:** Organize tasks around project dependencies and timelines.
- **Missing Information Identification:** Highlight unanswered questions and unclear requirements.
- **Risk Detection:** Identify potential project risks involving scope, budget, deadlines, and dependencies.
- **Human Approval Workflow:** Review and approve or reject actions before execution where approval is required.
- **Audit Logging:** Maintain a record of relevant agent and project actions.
- **PostgreSQL Persistence:** Store supported application data persistently using PostgreSQL and Drizzle ORM.
- **Diagnostics and Testing:** Check application health and run supported automated tests.

## Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express, TypeScript
- **AI:** Google Gemini API with Gemma 4 (`gemma-4-26b-a4b-it`)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Development Tools:** npm, Git, GitHub

## Architecture

TaskPilot AI uses a React frontend to collect client briefs and display project insights. An Express backend handles analysis requests, task operations, approvals, diagnostics, and audit logging. The AI model supports brief analysis and planning, while PostgreSQL provides persistent storage for supported records.

## Getting Started

### Prerequisites

- Node.js and npm
- A PostgreSQL database
- A Google AI API key with access to the configured model

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_REPOSITORY_URL
   cd YOUR_PROJECT_DIRECTORY
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables using the variable names expected by the application. Common configuration includes:

   ```env
   GEMINI_API_KEY=your_google_ai_api_key
   DATABASE_URL=your_postgresql_connection_string
   ```

   Never commit real API keys, passwords, or database credentials. Keep secret values in your local environment or the deployment platform's secret manager.

4. Apply the database schema using the project's Drizzle configuration:

   ```bash
   npx drizzle-kit push
   ```

5. Start the application using the development script configured in `package.json`:

   ```bash
   npm run dev
   ```

   Check `package.json` for the exact available scripts and any additional environment configuration required by your setup.

## API Endpoints

The backend includes the following application endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check application health |
| POST | `/api/diagnostics/test-model` | Test AI model connectivity |
| GET | `/api/tasks` | Retrieve tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/approvals` | Retrieve approval requests |
| POST | `/api/approvals/:id/decide` | Approve or reject a request |
| GET | `/api/audit-log` | Retrieve audit records |
| POST | `/api/analyze` | Analyze a client brief |
| POST | `/api/tests/run` | Run supported application tests |

Confirm endpoint behavior against the current implementation before integrating external clients.

## Testing and Build

Run the scripts available in `package.json`. Typical commands include:

```bash
npm run lint
npm run build
```

If a TypeScript check script or automated test script is configured, run it as well. Database-backed features require a valid database configuration.

## Security and Privacy

- Keep API keys and database credentials out of source control.
- Configure environment variables securely.
- Validate incoming requests and handle errors safely.
- Use approval workflows for actions that require human authorization.
- Avoid logging sensitive client information.

## Current Scope

TaskPilot AI focuses on manual client brief entry, AI-assisted analysis, project planning, task management, risk assessment, approvals, and audit logging. File upload is not currently included.

## Hackathon Project

Built as an AI-powered project operations assistant for a hackathon project.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes and test them.
4. Open a pull request describing your changes.

## License

No license has been specified yet. Add a `LICENSE` file before describing this project as open source under a particular license.
