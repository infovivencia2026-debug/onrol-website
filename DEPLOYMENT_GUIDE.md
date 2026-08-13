# Phase 1 Deployment Guide

## Database Migration Deployment Steps

The meetings database schema needs to be deployed to Supabase before the application can function. Follow these steps:

### Option 1: Deploy via Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: **ONROL**
3. Go to **SQL Editor** section in the left sidebar
4. Click **"New query"** button
5. Copy the contents of: `supabase/migrations/20260420_meetings_schema_v1.sql`
6. Paste the SQL into the editor
7. Click **"Run"** button (blue play icon in the bottom right)
8. Verify that all queries execute successfully (look for green checkmarks)

**Expected Output:**
- All CREATE TABLE statements should execute without errors
- Indexes should be created
- RLS policies should be enabled
- Helper functions and triggers should be created

### Option 2: Deploy via Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Install if not already installed
npm install -g supabase

# Deploy the migration
supabase migration up
```

### Option 3: Deploy via Script (if CLI setup later)

```bash
node scripts/deploy-migrations.mjs
```

## Verification Steps

After deployment, verify the migration succeeded:

1. **Check Tables**: In Supabase Dashboard > Table Editor
   - You should see: `meetings`, `meeting_participants`, `meeting_chat_messages`, `meeting_recordings`, `meeting_invites`, `meeting_breakout_rooms`

2. **Check RLS Policies**: In Table Editor > select a table > **RLS** tab
   - You should see policies for SELECT, INSERT, UPDATE, DELETE operations

3. **Check Indexes**: In SQL Editor, run:
   ```sql
   SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE 'meeting%';
   ```
   - Should show 10 indexes created

4. **Check Functions**: In SQL Editor, run:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_schema = 'public' AND routine_name LIKE 'generate_meeting%';
   ```
   - Should show `generate_meeting_code` function

## API Routes Status

All Phase 1 API routes are now implemented and ready:

- ✅ `POST /api/meetings/create` - Create new meeting
- ✅ `GET /api/meetings/list` - List user's meetings
- ✅ `POST /api/meetings/:id/join` - Join a meeting
- ✅ `POST /api/meetings/:id/leave` - Leave a meeting

## Component Status

All Phase 1 components are implemented and integrated:

- ✅ `MeetingListView.tsx` - Meeting discovery interface
- ✅ `MeetingCreateModal.tsx` - Create/schedule meetings
- ✅ Integrated into `TaskManager.tsx` under Meeting section

## Testing Phase 1

After migration is deployed, test the following:

1. **Create Instant Meeting**
   - Click "New Meeting" in Meeting section
   - Select "Start Instantly"
   - Enter title, click "Create"
   - Should see meeting code and join option

2. **Create Scheduled Meeting**
   - Click "New Meeting"
   - Select "Schedule for Later"
   - Fill in date, time, and other details
   - Click "Create"
   - Should return to list

3. **View Meetings List**
   - Switch to Meeting section
   - Should see meetings filtered by status
   - Can search by title

4. **Join a Meeting**
   - Click on any meeting in the list
   - Should open MeetingRoom with that meeting code
   - Can start video call

## Troubleshooting

### Permission Denied Errors
- Ensure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- The account must have admin privileges for RLS creation

### "Table already exists" Errors
- The migration includes `IF NOT EXISTS` clauses
- Safe to run multiple times

### RLS Policy Errors
- Common: "RLS policy violates..." - means auth.users table reference
- Ensure your Supabase project has authentication enabled

### Function Creation Fails
- Ensure PostgreSQL is version 12+ (Supabase provides 15+)
- Check function syntax is valid PL/pgSQL

## Next Steps After Deployment

1. Deploy to all platforms:
   ```bash
   npm run deploy:full
   ```

2. Test on web, mobile, and desktop:
   - Web: Test in browser
   - Mobile: Install APK
   - Desktop: Install exe

3. Gather user feedback and move to Phase 2 (Meeting Controls & Security)
