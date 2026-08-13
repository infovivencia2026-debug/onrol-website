# 🚀 ONROL Community Platform - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase project with credentials configured
- Existing ONROL website codebase

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install @studio-freight/react-lenis
```

*Note: Supabase is already installed in the project.*

---

## 🗄️ Database Setup

### Step 1: Run the Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-community-schema.sql`
4. Paste and run the entire script

This will create:
- 18 database tables
- RLS policies
- Indexes for performance
- Triggers for automation
- Default achievements

### Step 2: Create Initial Admin

After running the schema, create your first admin user:

```sql
-- First, create the auth user (do this via Supabase Auth UI or API)
-- Then link to admins table:

INSERT INTO public.admins (id, email, full_name, role)
VALUES (
  'YOUR-AUTH-USER-UUID',  -- Replace with actual UUID from auth.users
  'admin@onrol.in',
  'Admin Name',
  'admin'
);
```

### Step 3: Create Test Member (Optional)

```sql
-- Create test user via Supabase Auth UI
-- Then create member record:

INSERT INTO public.community_members (id, email, full_name, member_status)
VALUES (
  'TEST-USER-UUID',
  'test@example.com',
  'Test Member',
  'approved'  -- Set to 'approved' for immediate access
);
```

---

## 🔧 Configuration

### Supabase Configuration

The Supabase client is already configured in `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'https://qcantdsmcrjfewcfpyej.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

If you need to update these, modify the file with your credentials.

---

## 🏃 Running the Application

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

---

## 📍 Routes Overview

### Public Routes

| Route | Description |
|-------|-------------|
| `/` | Main ONROL website |
| `/community` | Community landing page |
| `/community/login` | Community login (email/password) |
| `/login` | Main website login |
| `/signup` | Main website signup |
| `/portal` | User portal |

### Protected Community Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/community/dashboard` | Community home | Approved members |
| `/community/discussions` | Forum/discussions | Approved members |
| `/community/members` | Member directory | Approved members |
| `/community/projects` | Project showcase | Approved members |
| `/community/jobs` | Job board | Approved members |
| `/community/events` | Events calendar | Approved members |
| `/community/leaderboard` | Gamification | Approved members |
| `/community/settings` | User settings | Approved members |

### Admin Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/community/admin` | Admin dashboard | Admins only |

---

## 🔐 Access Control Flow

### For New Users

1. User enrolls in paid ONROL program → Account created in `auth.users`
2. Trigger auto-creates record in `community_members` with status `pending`
3. Admin receives notification (manual check required)
4. Admin approves member in dashboard
5. User receives approval email (manual or automated)
6. User can now login at `/community/login`

### Login Flow

1. User visits `/community/login`
2. Enters email and password
3. System validates credentials via Supabase Auth
4. Checks `member_status` in `community_members` table
5. If `approved` → Redirect to dashboard
6. If `pending` → Show "awaiting approval" message
7. If `rejected` → Show "contact admin" message

---

## 📁 New Files Added

```
src/
├── contexts/
│   └── CommunityAuthContext.tsx      # Community auth state
├── components/
│   ├── community/
│   │   └── CommunityLayout.tsx       # Community shell/layout
│   └── ProtectedCommunityRoute.tsx   # Route guard
├── pages/
│   ├── Community.tsx                 # Community landing
│   ├── CommunityLogin.tsx            # Community login page
│   ├── CommunityDashboard.tsx        # Dashboard
│   ├── CommunityDiscussions.tsx      # Discussions forum
│   ├── CommunityMembers.tsx          # Member directory
│   ├── CommunityProjects.tsx         # Projects showcase
│   ├── CommunityJobs.tsx             # Job board
│   ├── CommunityEvents.tsx           # Events calendar
│   ├── CommunityLeaderboard.tsx      # Gamification
│   ├── CommunitySettings.tsx         # User settings
│   └── AdminDashboard.tsx            # Admin panel
└── App.tsx                           # Updated with routes

Root:
├── supabase-community-schema.sql     # Database schema
├── COMMUNITY_SECURITY.md             # Security documentation
└── COMMUNITY_SETUP.md                # This file
```

---

## 🎨 Design System

The community uses the same design system as the main website:

- **Colors:** Primary orange (#ff8c00), dark background
- **Fonts:** Space Grotesk (display), DM Sans (body)
- **Components:** Shadcn/ui + custom glassmorphism
- **Animations:** Framer Motion

---

## 🧪 Testing

### Test Community Login

1. Create test user in Supabase Auth
2. Create member record with `approved` status
3. Visit `/community/login`
4. Login with test credentials
5. Verify access to all community features

### Test Admin Panel

1. Create admin record in `public.admins` table
2. Login as that user
3. Visit `/community/admin`
4. Test member approval workflow

---

## 🔧 Admin Tasks

### Approve a Member

1. Go to `/community/admin`
2. Click "Members" tab
3. Find pending member
4. Click green checkmark to approve

### Suspend a Member

1. Go to `/community/admin` → Members
2. Find the member
3. Click the warning triangle icon
4. Confirm suspension

### Post Announcement

1. Go to Discussions
2. Create new discussion
3. Mark as "Pinned" (admin only)

---

## 📊 Analytics

Track community metrics via:

1. **Admin Dashboard** - Real-time stats
2. **Supabase Dashboard** - Database analytics
3. **Custom queries:**

```sql
-- New members this week
SELECT COUNT(*) FROM community_members 
WHERE joined_at > NOW() - INTERVAL '7 days';

-- Most active discussions
SELECT title, views_count FROM discussions 
ORDER BY views_count DESC LIMIT 10;
```

---

## 🐛 Troubleshooting

### "Member not found" error

- Check if member record exists in `community_members` table
- Verify `auth.uid()` matches member `id`

### RLS policy blocking access

- Review RLS policies in Supabase dashboard
- Ensure member status is `approved`

### Admin can't access dashboard

- Verify admin record exists in `public.admins` table
- Check `id` matches auth user ID

---

## 📞 Support

For issues or questions:
- Check `COMMUNITY_SECURITY.md` for security details
- Review Supabase logs for errors
- Contact: dev@onrol.in

---

## 🚀 Next Steps

After setup:

1. ✅ Test login flow
2. ✅ Create admin accounts
3. ✅ Approve first members
4. ✅ Post welcome discussion
5. ✅ Add initial job postings
6. ✅ Schedule first event

---

**Happy Building! 🎉**
