-- SEO + AI-visibility agent tables.
--
-- Four agents share this schema:
--   1. backlink_opportunities — discovered, pending outreach, contacted, won, lost
--   3. syndications — every blog post → multi-platform repost log
--   4. quora_drafts — auto-drafted Quora answers awaiting human review
--   5. citation_runs + citation_results — weekly AI-engine query tracker
--
-- All tables service-role-only. The community anon key cannot read or write.
-- Agents authenticate using SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists "uuid-ossp";

-- ── 1. backlink_opportunities ──────────────────────────────────────────────
create table if not exists public.backlink_opportunities (
  id uuid primary key default uuid_generate_v4(),
  source text not null,                       -- "competitor_mention" | "reddit" | "quora" | "broken_link" | "unlinked_mention" | "haro"
  target_url text not null,                   -- the URL where ONROL could be linked
  target_title text,
  context text,                               -- snippet of why it's an opportunity
  outreach_email text,                        -- discovered contact, if any
  draft_pitch text,                           -- AI-drafted outreach message
  priority int default 50 check (priority between 0 and 100),
  status text not null default 'discovered' check (status in ('discovered','drafted','contacted','responded','won','lost','ignored')),
  contacted_at timestamptz,
  responded_at timestamptz,
  outcome_url text,                           -- the page that links back, if won
  notes text,
  discovered_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_backlink_opps_status on public.backlink_opportunities(status, priority desc);
create index if not exists idx_backlink_opps_source on public.backlink_opportunities(source);

-- ── 3. syndications ────────────────────────────────────────────────────────
create table if not exists public.syndications (
  id uuid primary key default uuid_generate_v4(),
  source_slug text not null,                  -- ONROL blog slug (e.g. "top-ai-tools-india-2026")
  source_url text not null,                   -- canonical onrol.in URL
  platform text not null check (platform in ('medium','devto','hashnode','linkedin','substack')),
  target_url text,                            -- the URL on the syndication platform
  status text not null default 'pending' check (status in ('pending','published','failed','skipped')),
  error text,
  published_at timestamptz,
  created_at timestamptz default now()
);
create unique index if not exists uq_syndications_source_platform on public.syndications(source_slug, platform);

-- ── 4. quora_drafts ────────────────────────────────────────────────────────
create table if not exists public.quora_drafts (
  id uuid primary key default uuid_generate_v4(),
  question_url text not null,                 -- Quora question URL
  question_text text not null,
  category text,                              -- "ai-course-india" | "freelancing" | "career-switch" | etc.
  draft_answer text,                          -- AI-generated answer awaiting human review
  draft_model text,                           -- "claude-opus-4-7" | "gpt-5" etc.
  status text not null default 'drafted' check (status in ('drafted','approved','posted','rejected','needs_revision')),
  posted_url text,                            -- URL of the live Quora answer once posted
  posted_by text,                             -- which alumni / founder / team member posted
  notes text,
  discovered_at timestamptz default now(),
  posted_at timestamptz
);
create unique index if not exists uq_quora_drafts_question_url on public.quora_drafts(question_url);
create index if not exists idx_quora_drafts_status on public.quora_drafts(status);

-- ── 5. citation_runs (parent) + citation_results (child) ───────────────────
create table if not exists public.citation_runs (
  id uuid primary key default uuid_generate_v4(),
  run_date date not null default current_date,
  total_queries int not null,
  total_citations int not null default 0,
  citation_rate numeric(5,2) generated always as (
    case when total_queries > 0 then (total_citations::numeric / total_queries::numeric) * 100 else 0 end
  ) stored,
  notes text,
  created_at timestamptz default now()
);
create unique index if not exists uq_citation_runs_date on public.citation_runs(run_date);

create table if not exists public.citation_results (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references public.citation_runs(id) on delete cascade,
  query text not null,
  engine text not null check (engine in ('openai','anthropic','google_gemini','perplexity')),
  model text not null,
  response_text text,
  onrol_cited boolean not null default false,  -- was onrol.in mentioned/cited?
  cited_url text,                              -- which onrol.in URL was cited (if any)
  competitor_cited text,                       -- which competitors WERE cited instead
  raw_sources jsonb,                           -- full source list returned by engine
  created_at timestamptz default now()
);
create index if not exists idx_citation_results_run on public.citation_results(run_id);
create index if not exists idx_citation_results_engine on public.citation_results(engine, onrol_cited);

-- ── RLS — these tables are service-role only ───────────────────────────────
alter table public.backlink_opportunities enable row level security;
alter table public.syndications enable row level security;
alter table public.quora_drafts enable row level security;
alter table public.citation_runs enable row level security;
alter table public.citation_results enable row level security;

-- No policies = no anon access. Service role bypasses RLS by design.

-- ── Trigger: updated_at on backlink_opportunities ──────────────────────────
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_backlink_opps_updated_at on public.backlink_opportunities;
create trigger trg_backlink_opps_updated_at
  before update on public.backlink_opportunities
  for each row execute function public.touch_updated_at();
