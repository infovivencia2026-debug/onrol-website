/**
 * Meeting Types - Complete type definitions for professional meeting app
 */

export interface Meeting {
  id: string;
  code: string;
  title: string;
  description?: string;
  host_id: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'ongoing' | 'ended' | 'cancelled';
  meeting_type: 'instant' | 'scheduled';
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  max_participants: number;
  require_password: boolean;
  allow_recording: boolean;
  allow_chat: boolean;
  allow_hand_raise: boolean;
  is_locked: boolean;
  waiting_room_enabled: boolean;
  related_task_id?: string;
  related_institution_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  duration_seconds?: number;
  participant_status: 'invited' | 'waiting' | 'joined' | 'left';
  video_enabled: boolean;
  audio_enabled: boolean;
  is_presenter: boolean;
  is_hand_raised: boolean;
  hand_raise_time?: string;
  created_at: string;
}

export interface MeetingChatMessage {
  id: string;
  meeting_id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'system' | 'file';
  is_pinned: boolean;
  reply_to_message_id?: string;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
}

export interface MeetingRecording {
  id: string;
  meeting_id: string;
  host_id: string;
  storage_path?: string;
  file_size_bytes?: number;
  duration_seconds?: number;
  recording_status: 'recording' | 'processing' | 'ready' | 'failed';
  transcript_text?: string;
  summary?: string;
  action_items?: string[];
  decisions?: string[];
  created_at: string;
  completed_at?: string;
}

export interface MeetingInvite {
  id: string;
  meeting_id: string;
  invited_by_id: string;
  invited_user_id: string;
  invite_status: 'pending' | 'accepted' | 'declined' | 'no_response';
  invite_sent_at: string;
  response_at?: string;
}

export interface MeetingContextType {
  meeting: Meeting | null;
  participants: MeetingParticipant[];
  chatMessages: MeetingChatMessage[];
  isRecording: boolean;
  recordingStatus: 'idle' | 'recording' | 'processing';
  waitingRoomEnabled: boolean;
  waitingParticipants: MeetingParticipant[];
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  max_participants?: number;
  is_recurring?: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  participant_ids?: string[];
  allow_recording?: boolean;
  waiting_room_enabled?: boolean;
}

export type MeetingFilter = 'upcoming' | 'ongoing' | 'past' | 'invitations' | 'all';
