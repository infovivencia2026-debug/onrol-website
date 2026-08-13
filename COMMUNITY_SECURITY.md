# 🔒 ONROL Community Platform - Security & Access Control Documentation

## Overview

The ONROL Community Platform is an **exclusive, paid-member-only** space for ONROL learners. This document outlines the security measures, access control mechanisms, and encryption strategies implemented to protect the community.

---

## 📋 Table of Contents

1. [Access Control Model](#access-control-model)
2. [Authentication Flow](#authentication-flow)
3. [Authorization Layers](#authorization-layers)
4. [Data Encryption](#data-encryption)
5. [Row Level Security (RLS)](#row-level-security)
6. [Admin Controls](#admin-controls)
7. [Security Best Practices](#security-best-practices)

---

## 🔐 Access Control Model

### Membership Tiers

| Status | Description | Access Level |
|--------|-------------|--------------|
| `pending` | Awaiting admin approval | No access to community features |
| `approved` | Verified paid member | Full community access |
| `rejected` | Application denied | No access |
| `suspended` | Temporarily banned | Access revoked |

### Member Types

| Type | Permissions |
|------|-------------|
| `learner` | Standard community access |
| `mentor` | Enhanced access + mentorship features |
| `admin` | Full moderation and management access |

---

## 🔑 Authentication Flow

### 1. User Registration (Main Site)
```
User enrolls in paid program → Supabase Auth creates user → 
Community member record created (status: pending) → Admin notified
```

### 2. Admin Approval
```
Admin reviews pending member → Approves/Rejects → 
Member status updated → Welcome email sent (if approved)
```

### 3. Community Login
```
User enters credentials → Supabase Auth validates → 
Check member_status → If 'approved', grant access → 
Redirect to dashboard
```

### Code Implementation

```typescript
// CommunityAuthContext.tsx
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Fetch member status
  const { data: member } = await supabase
    .from('community_members')
    .select('member_status')
    .eq('id', data.user.id)
    .single();

  if (member.member_status !== 'approved') {
    throw new Error('Account pending approval');
  }

  return { success: true };
};
```

---

## 🛡️ Authorization Layers

### Layer 1: Route Protection
```typescript
// ProtectedCommunityRoute.tsx
export const ProtectedCommunityRoute = ({ children, requireAdmin = false }) => {
  const { isApproved, isAdmin, loading } = useCommunityAuth();

  if (!isApproved) return <Navigate to="/community/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/community/dashboard" replace />;

  return <>{children}</>;
};
```

### Layer 2: Component-Level Checks
```typescript
// Check approval before rendering sensitive components
if (!isApproved) return null;
```

### Layer 3: API-Level Security (RLS)
```sql
-- Only approved members can view community data
CREATE POLICY "Approved members can view discussions" ON public.discussions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_members cm 
      WHERE cm.id = auth.uid() AND cm.member_status = 'approved'
    )
  );
```

---

## 🔒 Data Encryption

### At Rest (Supabase)
- All data encrypted using AES-256
- Supabase manages encryption keys
- Database-level encryption enabled

### In Transit
- All API calls use HTTPS (TLS 1.3)
- WebSocket connections encrypted
- JWT tokens for authentication

### Sensitive Data Handling
```typescript
// Never expose sensitive fields to client
const safeMemberData = {
  id: member.id,
  full_name: member.full_name,
  // Exclude: email, approved_by, etc.
};
```

---

## 📊 Row Level Security (RLS)

### Enabled Tables

| Table | RLS Policy |
|-------|-----------|
| `community_members` | Users can view own profile + approved members |
| `activity_feed` | Approved members only |
| `discussions` | Approved members only |
| `projects` | Approved members only |
| `jobs` | Approved members can view |
| `notifications` | Users can only view own notifications |

### Example RLS Policies

```sql
-- View own profile
CREATE POLICY "Members can view own profile" ON public.community_members
  FOR SELECT USING (auth.uid() = id);

-- View approved members only
CREATE POLICY "Members can view approved members" ON public.community_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.community_members cm 
      WHERE cm.id = auth.uid() AND cm.member_status = 'approved')
    AND member_status = 'approved'
  );

-- Admins can do everything
CREATE POLICY "Admins can view all members" ON public.community_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );
```

---

## 👨‍💼 Admin Controls

### Admin Roles

| Role | Permissions |
|------|-------------|
| `moderator` | Manage content, approve members |
| `admin` | Full access + manage other admins |
| `super_admin` | Unrestricted access |

### Admin Actions

1. **Member Management**
   - Approve/reject pending members
   - Suspend/unsuspend members
   - View member details

2. **Content Moderation**
   - Hide/show discussions
   - Remove inappropriate content
   - Pin important announcements

3. **Reports Handling**
   - Review reported content
   - Take action on violators
   - Dismiss false reports

### Admin Dashboard Access
```typescript
// Only admins can access
<Route path="/community/admin" element={
  <ProtectedCommunityRoute requireAdmin>
    <AdminDashboard />
  </ProtectedCommunityRoute>
} />
```

---

## ✅ Security Best Practices

### For Developers

1. **Never trust client-side validation**
   - Always validate on server/RLS level
   - Client checks are UX-only

2. **Use parameterized queries**
   - Prevent SQL injection
   - Supabase handles this automatically

3. **Implement rate limiting**
   - Prevent brute force attacks
   - Use Supabase rate limiting

4. **Log security events**
   - Failed login attempts
   - Admin actions
   - Suspicious activity

5. **Regular security audits**
   - Review RLS policies
   - Check for data leaks
   - Test authorization bypass

### For Users

1. **Strong passwords required**
   - Minimum 8 characters
   - Mix of letters, numbers, symbols

2. **Session management**
   - Auto-logout after inactivity
   - Single session per device (optional)

3. **Report suspicious activity**
   - Built-in reporting system
   - Admin review within 24 hours

---

## 🚨 Incident Response

### Security Breach Protocol

1. **Immediate Actions**
   - Revoke compromised sessions
   - Reset affected user passwords
   - Enable enhanced logging

2. **Investigation**
   - Review access logs
   - Identify breach source
   - Document findings

3. **Recovery**
   - Patch vulnerability
   - Notify affected users
   - Update security policies

---

## 📁 File Structure

```
src/
├── contexts/
│   ├── AuthContext.tsx          # Main auth (website)
│   └── CommunityAuthContext.tsx # Community-specific auth
├── components/
│   ├── community/
│   │   └── CommunityLayout.tsx  # Community shell
│   └── ProtectedCommunityRoute.tsx
├── pages/
│   ├── Community.tsx            # Community landing
│   ├── CommunityLogin.tsx       # Community login
│   ├── CommunityDashboard.tsx   # Dashboard
│   ├── AdminDashboard.tsx       # Admin panel
│   └── ...                      # Other community pages
└── lib/
    └── supabase.ts              # Supabase client
```

---

## 🔧 Configuration

### Environment Variables

```env
# Supabase (already configured)
VITE_SUPABASE_URL=https://qcantdsmcrjfewcfpyej.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Add for production
VITE_COMMUNITY_SECRET=your-secret-key
VITE_ADMIN_EMAILS=admin1@onrol.in,admin2@onrol.in
```

### Required Database Setup

1. Run `supabase-community-schema.sql` in Supabase SQL Editor
2. Create initial admin user manually:
```sql
INSERT INTO public.admins (id, email, full_name, role)
VALUES ('auth-user-uuid', 'admin@onrol.in', 'Admin Name', 'admin');
```

---

## 📞 Support

For security concerns or questions:
- Email: security@onrol.in
- Admin Dashboard: /community/admin

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024 | Initial implementation |

---

**Last Updated:** 2024
**Maintained By:** ONROL Development Team
