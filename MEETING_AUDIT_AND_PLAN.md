# ONROL Meeting App - Professional Audit & Implementation Plan

## Executive Summary
Current meeting system has basic WebRTC functionality but lacks enterprise features found in Google Meet/Zoom. This document outlines critical gaps and a phased implementation roadmap.

---

## Current State Assessment

### ✅ What Works
- Basic peer-to-peer WebRTC video meetings
- Meeting code generation (6 chars)
- Screen sharing
- Gallery and spotlight views
- Real-time transcription (Web Speech API)
- Meeting AI analysis (Mistral)
- Emoji/reaction bubbles

### ❌ Critical Gaps
1. **No Meeting Discovery** - Users can't see upcoming/ongoing meetings
2. **Manual Entry** - Code must be typed manually (poor UX)
3. **No Lobby/Waiting Room** - Participants join directly
4. **No Controls** - Can't mute all, lock meeting, remove participants
5. **No Recording** - Can't save meetings
6. **No Chat** - No in-meeting messaging
7. **No Scheduling** - No calendar/schedule interface
8. **No Password Protection** - Meetings not secure
9. **No Hand Raise** - Can't request attention
10. **Limited Participant Management** - No participant list controls

---

## Implementation Roadmap

### PHASE 1: Meeting Discovery & Scheduling (1-2 weeks)

#### 1.1 Database Schema Updates
```sql
-- New tables
CREATE TABLE meetings (
  id UUID PRIMARY KEY,
  code VARCHAR(6) UNIQUE,
  title VARCHAR(255),
  description TEXT,
  host_id UUID REFERENCES auth.users,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status ENUM ('scheduled', 'ongoing', 'ended', 'cancelled'),
  is_recurring BOOLEAN,
  max_participants INT,
  require_password BOOLEAN,
  password_hash VARCHAR(255),
  allow_recording BOOLEAN,
  create_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings,
  user_id UUID REFERENCES auth.users,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  duration_seconds INT,
  status ENUM ('invited', 'joined', 'ended')
);

CREATE TABLE meeting_chat_messages (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings,
  user_id UUID REFERENCES auth.users,
  message TEXT,
  sent_at TIMESTAMP
);

CREATE TABLE meeting_recordings (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings,
  storage_path VARCHAR(255),
  duration_seconds INT,
  created_at TIMESTAMP
);
```

#### 1.2 Features to Build
- **Meeting List View**
  - Upcoming meetings (next 7 days)
  - Ongoing meetings (with join button)
  - Past meetings (with replay/notes)
  - Search and filter
  
- **Meeting Creation Modal**
  - Schedule for later or start now
  - Set title, description
  - Add participants directly
  - Duration settings
  - Recurring options (daily, weekly)

- **Notifications**
  - 15min/5min reminders for upcoming meetings
  - Start notification with join link
  - One-click "Join Meeting" from notification

---

### PHASE 2: Meeting Controls & Security (2-3 weeks)

#### 2.1 Host Controls Panel
```jsx
Controls to implement:
- Mute all participants (host only)
- Remove participant
- Lock meeting (after all join)
- Password-protect meeting
- Set participant max limit
- Start/End recording
- Emoji reactions (already done)
- Hand raise requests
```

#### 2.2 Participant Management
- Participant list with:
  - Name, joined time
  - Video/audio status icons
  - Mute indicator
  - Remove button (host only)
  - Make presenter (co-host)
  
#### 2.3 Security Features
- Password-protected meetings
- Waiting room/Lobby
  - Host approves entry
  - Shows waiting participants
- Meeting lock (no new joiners)
- Participant removal
- Meeting access controls (invited only)

---

### PHASE 3: Meeting Features & Communication (2 weeks)

#### 3.1 In-Meeting Chat
- Message history
- Pin important messages
- Search messages
- File sharing (images/docs)
- Reaction to messages

#### 3.2 Hand Raise Feature
- Participant click "raise hand"
- Host sees raised hands list
- Lower hand option
- Audio alert for raised hands

#### 3.3 Spotlight/Pin Features
- Pin specific participant
- Spotlight mode (automatic for speaker)
- Grid view with resize

---

### PHASE 4: Recording & Cloud Storage (1-2 weeks)

#### 4.1 Recording Implementation
- Start/Stop recording (host only)
- Cloud storage in Supabase (S3/GCS)
- Recordings table with metadata
- Recording playback viewer

#### 4.2 Recording Features
- Auto-save transcripts
- Save action items
- Download recording
- Share recording link
- Recording storage limits

---

### PHASE 5: Advanced Meeting Features (3+ weeks)

#### 5.1 Breakout Rooms
- Create breakout rooms
- Auto/manual assignment
- Switch between rooms
- Broadcast to all rooms

#### 5.2 Polls & Q&A
- Create live polls
- Multiple choice questions
- Show results in real-time
- Q&A section with upvoting

#### 5.3 Virtual Backgrounds
- Blur background
- Custom background images
- Background effects

#### 5.4 Meeting Scheduling Calendar
- Google Calendar integration
- Outlook integration
- Automatic meeting invites
- Attendee scheduling

---

## Implementation Priority (MVP First)

### **MUST HAVE (Week 1-2)**
1. ✅ Meeting list view (upcoming, ongoing, past)
2. ✅ One-click join from list
3. ✅ Meeting creation with scheduling
4. ✅ Notifications with join link
5. ✅ Participant list
6. ✅ Basic host controls (mute, remove)
7. ✅ Waiting room/Lobby

### **SHOULD HAVE (Week 3-4)**
8. In-meeting chat
9. Hand raise feature
10. Password protection
11. Meeting lock
12. Recording (basic)

### **NICE TO HAVE (Week 5+)**
13. Breakout rooms
14. Polls/Q&A
15. Virtual backgrounds
16. Calendar integration

---

## Comparison with Google Meet & Zoom

| Feature | Google Meet | Zoom | ONROL (Current) | ONROL (Target) |
|---------|------------|------|-----------------|----------------|
| Video Meeting | ✅ | ✅ | ✅ | ✅ |
| Screen Share | ✅ | ✅ | ✅ | ✅ |
| Audio Conference | ✅ | ✅ | ✅ | ✅ |
| Meeting List | ✅ | ✅ | ❌ | ✅ |
| Scheduled Meetings | ✅ | ✅ | ❌ | ✅ |
| Chat in Meeting | ✅ | ✅ | ❌ | ✅ |
| Participant Controls | ✅ | ✅ | ❌ | ✅ |
| Host Controls Panel | ✅ | ✅ | ❌ | ✅ |
| Recording | ✅ | ✅ | ❌ | ✅ |
| Waiting Room | ✅ | ✅ | ❌ | ✅ |
| Hand Raise | ✅ | ✅ | ❌ | ✅ |
| Mute All | ✅ | ✅ | ❌ | ✅ |
| Remove Participant | ✅ | ✅ | ❌ | ✅ |
| Lock Meeting | ✅ | ✅ | ❌ | ✅ |
| Participant Limit | ✅ | ✅ | ❌ | ✅ |
| Breakout Rooms | ✅ | ✅ | ❌ | (Phase 5) |
| Polling | ✅ | ✅ | ❌ | (Phase 5) |
| Virtual Backgrounds | ✅ | ✅ | ❌ | (Phase 5) |
| Calendar Integration | ✅ | ✅ | ❌ | (Phase 5) |

---

## Recommended Approach

### Option A: Quick Win (1 week)
Focus on **PHASE 1** only - just get meetings discoverable and joiner-friendly.
- Status: Meets basic expectations
- Effort: Low
- Impact: High (solves 80% of complaints)

### Option B: Complete MVP (2-3 weeks)
Complete **PHASE 1 + 2** - professional meeting app baseline.
- Status: Comparable to basic Zoom/Meet setup
- Effort: Medium
- Impact: Very High

### Option C: Full Feature Parity (6-8 weeks)
All **5 PHASES** - complete meeting platform.
- Status: Feature-complete vs Google Meet
- Effort: High
- Impact: Excellent

---

## Files to Create/Modify

### New Components
- `MeetingsList.tsx` - Meeting discovery & list
- `MeetingCreate.tsx` - Meeting creation modal
- `MeetingControls.tsx` - Host control panel
- `ParticipantList.tsx` - Participant management
- `MeetingChat.tsx` - In-meeting chat
- `HandRaise.tsx` - Hand raise feature
- `WaitingRoom.tsx` - Lobby screen
- `RecordingUI.tsx` - Recording controls

### New Pages
- `/meeting/schedule` - Meeting scheduling
- `/meeting/recordings` - Recording library
- `/meeting/upcoming` - Upcoming meetings center

### Database Migrations
- `20260415_meeting_schema_v2.sql` - New tables
- `20260415_meeting_functions.sql` - Helper functions

### API Routes
- `api/meetings/create`
- `api/meetings/list`
- `api/meetings/join`
- `api/meetings/record`
- `api/meetings/chat`

---

## Estimated Timeline

| Phase | Duration | Complexity |
|-------|----------|-----------|
| Phase 1 | 1-2 weeks | Medium |
| Phase 2 | 2-3 weeks | Medium |
| Phase 3 | 2 weeks | Medium |
| Phase 4 | 1-2 weeks | High |
| Phase 5 | 3+ weeks | High |
| **Total** | **6-8 weeks** | **High** |

---

## Next Steps

1. **Approve the roadmap** - Which phases to prioritize?
2. **Start Phase 1** - Build meeting discovery & scheduling
3. **Deploy incrementally** - Test after each phase
4. **Gather user feedback** - Adjust based on usage

---

## Questions for User

1. Should we implement all phases or just MVP (Phase 1+2)?
2. Is recording a critical feature?
3. Do we need calendar integration immediately?
4. What's the estimated time available for this work?
5. Should we migrate existing meetings to new schema?
