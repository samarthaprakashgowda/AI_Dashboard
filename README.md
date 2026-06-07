# AI Extraction Dashboard

This is a Next.js dashboard app that converts messy financial logs into structured financial data using AI.

## Key features

- `app/page.tsx`: React client page with textarea, submit button, and dashboard cards
- `app/api/analyze/route.ts`: server API route that processes text and returns structured results
- `zod` validation: ensures the returned object has the correct shape
- AI integration: supports Google AI Studio key and Vercel AI Gateway key
- Local fallback: returns mock data when no valid API key is configured

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Vercel AI SDK (`ai`)
- Google AI provider (`@ai-sdk/google`)
- `zod` for schema validation

## Local setup

```bash
cd ai-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Screenshot


![AI Extraction Dashboard](public/demo-screenshot.png)
![AI Extraction Dashboard - improved](public/version-2.png)

## Environment variables

Create or update `./.env.local` with either of these keys:

```env
# Use if you have Google AI Studio credentials
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_studio_key

# Use if you want Vercel AI Gateway instead
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
```

### Note
If no valid key is present, the app still works using a mock fallback. That means you can still demo the UI and pipeline even without AI credentials.

## How the AI route works

- The client calls `/api/analyze` with the user input text
- The API route checks for `GOOGLE_GENERATIVE_AI_API_KEY` and `AI_GATEWAY_API_KEY`
- If a key exists, it calls AI to extract structured financial data
- If no key exists, it returns a local mock result
- The result is validated against `FinancialSchema`

## Deploying to Vercel

1. Push this repo to GitHub or another Git provider
2. Import the project on Vercel
3. Add environment variables in Vercel:
   - `GOOGLE_GENERATIVE_AI_API_KEY` or
   - `AI_GATEWAY_API_KEY`
4. Deploy the app

If you don’t want to add a key, the deployed app still runs with the local mock fallback.

## Why this is a good AI demo

- Demonstrates frontend + backend AI integration
- Shows how to use schema validation for AI output
- Includes a safe fallback path for demos without credentials
- Uses a real AI SDK and an actual provider model

## Useful commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Files to highlight

- `app/page.tsx` — frontend analysis UI
- `app/api/analyze/route.ts` — AI extraction route
- `.env.local` — store your API keys here
- `package.json` — project dependencies and scripts

---


Project Evolution: From Extraction to RAG System
Version 1 — Structured AI Extraction

The initial version focused on converting messy financial text into structured, type-safe data using an LLM.
Architecture
User Input → LLM → Structured JSON → UI

Features

Schema-driven output using Zod
Reliable structured responses with generateObject
Dashboard UI for displaying extracted data
Prompt-based financial reasoning
Basic fallback using numeric extraction

Example
Input
Spent 40 on fuel, 20 on food, rent 1200

Output
JSON{  "totalExpenses": 1260,  "highestCategory": "rent",  "overdraftRisk": true,  "tips": [    "Reduce discretionary spending",    "Track categories"  ]}

Limitations
Relied entirely on LLM internal knowledge
No semantic understanding
No contextual or external knowledge
Weak fallback with limited categorization
No retrieval system


Version 2 — Semantic RAG System

Upgraded the system into a Retrieval-Augmented Generation (RAG) pipeline with semantic understanding and dynamic context injection.
Architecture
User Input
  ↓
Embeddings (local)
  ↓
Similarity Search
  ↓
Top-K Relevant Knowledge
  ↓
LLM
  ↓
Fallback System
  ↓
Structured JSON → UI

Key Improvements
Semantic Understanding

Introduced embeddings using a local model (@xenova/transformers)
Enabled meaning-based matching instead of keyword matching

Examples:

"lunch" → food
"Uber" → transport
"Amazon" → shopping


Retrieval System

Implemented similarity-based ranking
Used map → similarity → sort → top-k pattern
Automatically selects relevant context


Context Injection

Injects only relevant knowledge into the prompt
Improves reasoning accuracy and reduces hallucination


Local Embeddings

Runs without external APIs
No cost or rate limits
Faster development iteration


Improved Fallback

Replaced "unknown" with rule-based category detection
Ensures meaningful output even when LLM fails


Confidence Scoring

Added confidence value (0–1)
Indicates reliability of generated output


Hybrid System Design

Combines rules, embeddings, and LLM
Balances reliability, flexibility, and intelligence


Validation Layer

Uses Zod to enforce consistent output
Prevents invalid responses


What Version 2 Achieves

Real Retrieval-Augmented Generation (RAG) pipeline
Semantic search instead of keyword matching
Context-aware AI reasoning
Reliable fallback mechanisms
Structured and validated outputs


Key Concepts Learned

Embeddings for semantic representation
Similarity scoring and ranking
Retrieval with top-k selection
Context injection into prompts
Structured output generation
Hybrid AI system design
Fault-tolerant architecture


Version 3 — Production RAG with Vector Database
Overview
Upgraded the system from an in-memory RAG prototype to a production-style Retrieval-Augmented Generation (RAG) architecture using a vector database (Supabase). The system now performs scalable, semantic retrieval over persistent knowledge instead of relying on hardcoded data.

Architecture
User Input
  ↓
Embedding (local model)
  ↓
Supabase Vector Database (pgvector)
  ↓
Top-K Similarity Search
  ↓
Context Injection
  ↓
LLM (structured generation)
  ↓
Validated JSON → UI


Key Improvements
Vector Database Integration

Replaced in-memory knowledge with Supabase + pgvector
Stored embeddings persistently in a database
Enabled scalable retrieval across growing datasets


Semantic Retrieval at Scale

Used Supabase RPC (match_documents) for similarity search
Removed manual ranking logic from the application layer
Database now handles:

similarity computation
ranking
top-K selection

Persistent Knowledge Layer

Knowledge is no longer hardcoded
Added ability to:

insert embeddings once
reuse them across requests
maintain a clean dataset

Real RAG Execution

Verified retrieval using database results (not fallback)
Confirmed semantic matching:

"lunch" → food
"Amazon" → shopping


Context dynamically injected into prompts

Fault-Tolerant Design

Added fallback when:

Supabase query fails
No results are returned


Ensured API always returns valid schema-compliant JSON
Prevented crashes from propagating to frontend


Debugging & Observability

Added logging for:

Supabase responses
Retrieved context ("Knowledge used")

Enabled easier validation of retrieval correctness


Clean Separation of Concerns

Retrieval moved fully to database layer
Application focuses on:

orchestration
prompt construction
response validation


What Version 3 Achieves

Production-style RAG architecture
Scalable semantic search using vector database
Persistent knowledge storage
Accurate context-driven LLM responses
Robust fallback and error handling
Clear backend/frontend contract via schema validation


Key Concepts Learned

Vector databases and pgvector
RPC-based similarity search
Database-driven retrieval vs application-driven retrieval
Embedding storage and reuse
Separation of retrieval and generation layers
Handling schema mismatches and runtime failures


Summary
The project evolved from:
Structured extraction → In-memory RAG → Database-powered RAG
