# RAG Chat Deployment Guide (Budget Mode)

This setup keeps costs low:
- Retrieval in your own Supabase Postgres + pgvector
- Generation with Mistral free credits
- Strict top_k, context, and output token caps

## 1) Create RAG SQL objects

Run this in Supabase SQL Editor:

1. Open and execute [supabase/rag-budget-setup.sql](supabase/rag-budget-setup.sql)

## 2) Set function secrets

PowerShell:

```powershell
$projectRef = "qcantdsmcrjfewcfpyej"
$env:SUPABASE_ACCESS_TOKEN = "YOUR_SUPABASE_ACCESS_TOKEN"
npx supabase secrets set MISTRAL_API_KEY="YOUR_MISTRAL_API_KEY" --project-ref $projectRef
```

## 3) Deploy function

PowerShell:

```powershell
npx supabase functions deploy rag-chat --project-ref $projectRef --use-api --no-verify-jwt
```

## 4) Ingest ONROL docs into knowledge table

PowerShell:

```powershell
$env:SUPABASE_URL = "YOUR_SUPABASE_URL"
$env:SUPABASE_SERVICE_ROLE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY"
$env:MISTRAL_API_KEY = "YOUR_MISTRAL_API_KEY"
node scripts/ingest-rag-knowledge.mjs
```

## 5) Test endpoint

PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri "https://qcantdsmcrjfewcfpyej.supabase.co/functions/v1/rag-chat" -ContentType "application/json" -Body '{"message":"What programs does ONROL offer?"}'
```

## 6) Budget controls already enabled

Configured in [supabase/functions/rag-chat/index.ts](supabase/functions/rag-chat/index.ts):
- max user input length
- top_k = 3 retrieval
- context cap
- output token cap
