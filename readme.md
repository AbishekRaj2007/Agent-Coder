# 🤖 AgentCoder — Multi-Agent AI Coding Assistant

> A production-grade agentic AI system where three specialized LLM agents collaboratively plan, write, and review code in real time.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph.js-000000?style=flat&logo=langchain&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-F55036?style=flat&logo=groq&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)

---

## ✨ What It Does

AgentCoder breaks a coding task into a pipeline of three AI agents, each with a distinct role:

| Agent | Role |
|---|---|
| 🧠 **Planner** | Analyzes the task and produces a step-by-step implementation plan |
| 💻 **Coder** | Writes clean TypeScript code based on the plan |
| 🔍 **Reviewer** | Reviews the code for bugs and edge cases — sends it back to Coder if issues are found |

The **retry loop** is the key mechanism: if the Reviewer finds issues, it automatically routes back to the Coder with feedback. This continues up to 3 iterations until the code passes review.

Every agent response streams live to the browser via **Server-Sent Events** — you watch each agent think in real time.

---

## 🏗️ Architecture

```
User Prompt
     │
     ▼
┌─────────────┐     SSE stream      ┌──────────────┐
│  React UI   │ ◄────────────────── │ Express API  │
│ (Vite + TS) │                     │  :3001       │
└─────────────┘                     └──────┬───────┘
                                           │ invokes
                                           ▼
                                   ┌───────────────┐
                                   │   LangGraph   │
                                   │               │
                                   │  [Planner]    │
                                   │      ↓        │
                                   │  [Coder]      │
                                   │      ↓        │
                                   │  [Reviewer]   │
                                   │      │        │
                                   │   issues? ────┘
                                   │   (retry)     │
                                   └───────┬───────┘
                                           │ checkpoints
                                           ▼
                                       ┌───────┐
                                       │ Redis │
                                       └───────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Agent orchestration | [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) |
| LLM inference | [Groq](https://groq.com) — `llama-3.3-70b-versatile` |
| Streaming | Server-Sent Events (SSE) via Express |
| State persistence | Redis (via `@langchain/langgraph-checkpoint-redis`) |
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Groq API key — [get one free](https://console.groq.com)
- Redis (Docker, Memurai on Windows, or Upstash for cloud)

### 1. Clone the repo

```bash
git clone https://github.com/AbishekRaj2007/agent-coder.git
cd agent-coder
```

### 2. Install dependencies

```bash
# Backend
cd agent-coder
npm install

# Frontend
cd agent-coder-ui
npm install
```

### 3. Set up environment

```bash
# In agent-coder/
cp .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Start Redis

```bash
# Docker
docker run -d -p 6379:6379 redis

# Or Windows (Memurai)
# Install from memurai.com — runs automatically as a service
```

### 5. Run the app

```bash
# Terminal 1 — backend
cd agent-coder
npm run server

# Terminal 2 — frontend
cd agent-coder-ui
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and describe a coding task.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/run` | Start a new agent run, returns `{ runId }` |
| `GET` | `/stream/:runId` | SSE stream of agent events for a run |
| `GET` | `/history` | Last 20 completed runs from Redis |

### SSE Event format

```json
{
  "agent": "planner",
  "data": { "plan": "1. Define function signature..." },
  "done": false
}
```

---

## 📁 Project Structure

```
agent-coder/
├── src/
│   ├── agents/
│   │   ├── planner.ts      # Planner agent
│   │   ├── coder.ts        # Coder agent
│   │   └── reviewer.ts     # Reviewer agent
│   ├── graph.ts            # LangGraph definition + Redis checkpointer
│   ├── server.ts           # Express + SSE server
│   └── index.ts            # CLI entry point
├── .env.example
└── package.json

agent-coder-ui/
├── src/
│   └── App.tsx             # React frontend with SSE consumer
└── package.json
```

---

## 🔑 Key Concepts Learned

- **LangGraph stateful graphs** — defining nodes, edges, and conditional routing
- **Multi-agent orchestration** — agents communicating through shared state
- **Server-Sent Events** — persistent HTTP streaming from server to browser
- **Redis checkpointing** — persisting graph state across runs with `thread_id`
- **Agentic retry loops** — conditional edges that route based on agent output

---

## 🔭 Future Improvements

- [ ] Add `run_code` tool so the Coder can actually execute and test its output
- [ ] Syntax highlighting in the code panels (Shiki or Prism)
- [ ] Resume interrupted runs using Redis checkpoint + `thread_id`
- [ ] Deploy backend to Railway, frontend to Vercel
- [ ] Support multiple LLM providers (OpenAI, Anthropic) via LangChain

---

## 👤 Author

**Abishek Raj** — [@AbishekRaj2007](https://github.com/AbishekRaj2007)

Built as a portfolio project to learn LangGraph, agentic AI patterns, and real-time streaming.