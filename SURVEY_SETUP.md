# ONROL Survey Setup

This project now includes a separate anonymous survey flow:
- `/survey` (choose audience)
- `/survey/student`
- `/survey/professional`
- `/survey/thank-you`

No survey links are added to the existing ONROL website navigation.

## 1) Run this SQL in Supabase SQL Editor

```sql
create extension if not exists pgcrypto;

create table if not exists public.survey_student_responses (
  id uuid primary key default gen_random_uuid(),
  respondent_name text null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.survey_professional_responses (
  id uuid primary key default gen_random_uuid(),
  respondent_name text null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.survey_student_responses enable row level security;
alter table public.survey_professional_responses enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'survey_student_responses'
      and policyname = 'Allow anonymous inserts on student survey'
  ) then
    create policy "Allow anonymous inserts on student survey"
    on public.survey_student_responses
    for insert
    to anon, authenticated
    with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'survey_professional_responses'
      and policyname = 'Allow anonymous inserts on professional survey'
  ) then
    create policy "Allow anonymous inserts on professional survey"
    on public.survey_professional_responses
    for insert
    to anon, authenticated
    with check (true);
  end if;
end
$$;

grant insert on table public.survey_student_responses to anon, authenticated;
grant insert on table public.survey_professional_responses to anon, authenticated;
```

## 2) Optional Google Sheets auto-update

The app sends a webhook after successful survey completion if this env var exists:
- `VITE_SURVEY_SHEETS_WEBHOOK_URL`

Configured Google Sheet ID:
- `1TEAclRzjNCDtijn-Li0sqAthiYpBxXHnqRyri1Dv_o8`

### Steps
1. Copy `.env.example` to `.env`.
2. In Google Apps Script, paste code from `google-sheets-webhook.gs`.
3. Deploy as Web App:
  - Execute as: `Me`
  - Who has access: `Anyone`
4. Copy the deployed Web App URL.
5. Set `VITE_SURVEY_SHEETS_WEBHOOK_URL` to that URL in `.env`.
6. Rebuild/redeploy the frontend.

### Google Apps Script sample (`doPost`)

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp
    .openById("1TEAclRzjNCDtijn-Li0sqAthiYpBxXHnqRyri1Dv_o8")
    .getSheetByName("Responses");

  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: "Sheet tab 'Responses' not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");

  sheet.appendRow([
    new Date(),
    payload.event || "survey_completed",
    payload.survey_type || "",
    payload.table_name || "",
    payload.respondent_name || "",
    JSON.stringify(payload.answers || {}),
    payload.created_at || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3) Local test checklist

1. Run `npm run dev`.
2. Open `/survey` manually.
3. Submit student form and professional form.
4. Check Supabase tables for inserted rows.
5. If webhook is configured, verify a new row in Google Sheet.

## 4) Notes

- Survey is anonymous by design.
- Only optional name is collected.
- All question answers are stored in the `answers` JSONB column.
- Multi-select responses are stored as arrays inside JSON.
- Slider responses are stored as numbers inside JSON.

## 5) Recommended: server-side Google Sheets sync (no browser/CORS issues)

If browser webhook calls are unreliable, use this Supabase trigger so inserts are pushed to Google Sheets directly from the database.

Run this in Supabase SQL Editor:

```sql
create extension if not exists pg_net;

create or replace function public.forward_survey_row_to_google_sheets()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text := 'https://script.google.com/macros/s/AKfycbwh67Rla-D8CmuJXFLy8JBFkUHWGQqHVEFF2aXLUfw2WVMse0e2MNNwvvCg_cibpQvO/exec';
  survey_type text := case
    when tg_table_name = 'survey_student_responses' then 'student'
    else 'professional'
  end;
  payload jsonb;
begin
  payload := jsonb_build_object(
    'event', 'survey_completed',
    'survey_type', survey_type,
    'table_name', tg_table_name,
    'respondent_name', new.respondent_name,
    'answers', new.answers,
    'created_at', new.created_at
  );

  perform net.http_post(
    url := webhook_url,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := payload
  );

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'survey_student_responses'
      and t.tgname = 'trg_forward_student_survey_to_sheets'
      and not t.tgisinternal
  ) then
    create trigger trg_forward_student_survey_to_sheets
    after insert on public.survey_student_responses
    for each row execute function public.forward_survey_row_to_google_sheets();
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'survey_professional_responses'
      and t.tgname = 'trg_forward_professional_survey_to_sheets'
      and not t.tgisinternal
  ) then
    create trigger trg_forward_professional_survey_to_sheets
    after insert on public.survey_professional_responses
    for each row execute function public.forward_survey_row_to_google_sheets();
  end if;
end
$$;
```

After running this SQL, every new survey row in Supabase will be forwarded to Google Sheets automatically.

### Deduplication note

- The frontend direct webhook call has been removed from the survey form.
- Google Sheets updates now happen only through Supabase trigger forwarding.
- Redeploy Apps Script after updating `google-sheets-webhook.gs` so debug fields are removed.
