export type Role = "employee" | "admin";
export type TaskSection =
  | "dashboard"
  | "journey"
  | "tasks"
  | "create"
  | "institutions"
  | "settings"
  | "messenger_inbox"
  | "messenger_teams"
  | "messenger_announcements"
  | "messenger_directory"
  | "meeting"
  | "filetransfer"
  | "logs"
  | "user_management";
export type TaskCategory = "general" | "visit";
export type TaskType = "planned" | "unplanned";
export type Priority = "high" | "medium" | "low";
export type Status = "not_started" | "ongoing" | "completed" | "delayed";
export type VisitBrand = "Vivencia" | "ONROL";
export type InstitutionType = "School" | "College";
export type VisitStatus = "planned" | "reached" | "in_meeting" | "completed" | "followup_pending" | "rescheduled" | "closed_lost";
export type VisitOutcome =
  | "interested"
  | "need_proposal"
  | "need_demo"
  | "call_later"
  | "not_interested"
  | "revisit_required"
  | "met_wrong_person"
  | "decision_maker_not_available";
export type FollowUpType = "call" | "whatsapp" | "email" | "visit" | "demo" | "proposal";
export type FollowUpStatus = "pending" | "done" | "missed" | "rescheduled";
export type InterestLevel = "low" | "medium" | "high";
export type UiTheme = "light" | "dark";
export type AdminModule = "overview" | "pipeline" | "journey" | "tasks" | "team" | "reports" | "field_today";
export type VisitSectionKey =
  | "journey_workflow"
  | "institution_search"
  | "institution_summary"
  | "visit_history"
  | "visit_outcome"
  | "next_action"
  | "follow_up"
  | "quick_note"
  | "brand_details";
export type BrandDetails = {
  program_interest?: string[];
  audience_type?: string | null;
  class_group?: string[];
  department_group?: string[];
  interest_level?: InterestLevel | null;
  discussion_stage?: string | null;
  special_flags?: string[];
  opportunity_flags?: string[];
};
export type BrandRelevance = "vivencia" | "onrol" | "both";
export type LeadStage =
  | "new_lead"
  | "contacted"
  | "visited"
  | "interested"
  | "followup_pending"
  | "proposal_expected"
  | "proposal_sent"
  | "demo_scheduled"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type ConversionStatus = "not_converted" | "converted";
export type DealSizeCategory = "small" | "medium" | "large";
export type InstitutionDraft = {
  name: string;
  institutionType: InstitutionType;
  city: string;
  area: string;
  address: string;
  contactName: string;
  contactPhone: string;
  brandRelevance: BrandRelevance;
};
export type SpeechRecognitionEventLike = {
  results?: ArrayLike<ArrayLike<{ transcript?: string }>>;
};
export type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
export type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export type VisitSectionState = Record<VisitSectionKey, boolean>;

export type Institution = {
  id: string;
  name: string;
  normalized_name: string;
  institution_type: InstitutionType;
  brand_relevance: BrandRelevance;
  address_line_1: string | null;
  address_line_2: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_link: string | null;
  website: string | null;
  primary_contact_name: string | null;
  primary_contact_designation: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  alternate_contact_name: string | null;
  alternate_contact_designation: string | null;
  alternate_contact_phone: string | null;
  alternate_contact_email: string | null;
  notes_internal: string | null;
  strength?: number | null;
  current_lead_stage: LeadStage;
  conversion_status?: ConversionStatus;
  conversion_date?: string | null;
  converted_by?: string | null;
  conversion_brand?: "vivencia" | "onrol" | null;
  conversion_value?: number | null;
  expected_value?: number | null;
  final_value?: number | null;
  deal_size_category?: DealSizeCategory | null;
  lead_score?: number | null;
  last_stage_change_at?: string | null;
  stage_history?: Array<{ stage: LeadStage; at: string; by?: string | null }>;
  last_visit_at: string | null;
  last_outcome: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type OfficeUser = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department: string | null;
  is_active: boolean;
  phone?: string | null;
  bio?: string | null;
  status_message?: string | null;
  linkedin?: string | null;
  avatar_url?: string | null;
};

export type OfficeTask = {
  id: string;
  user_id: string;
  task_category?: TaskCategory | null;
  task_title: string;
  description: string;
  task_type: TaskType;
  priority: Priority;
  status: Status;
  visit_brand?: VisitBrand | null;
  institution_type?: InstitutionType | null;
  institution_name?: string | null;
  institution_id?: string | null;
  visit_date?: string | null;
  visit_status?: VisitStatus | null;
  check_in_at?: string | null;
  meeting_started_at?: string | null;
  meeting_completed_at?: string | null;
  check_out_at?: string | null;
  check_in_latitude?: number | null;
  check_in_longitude?: number | null;
  check_in_address?: string | null;
  check_in_city?: string | null;
  check_in_area?: string | null;
  check_in_maps_link?: string | null;
  check_in_location_at?: string | null;
  visit_outcome?: VisitOutcome[] | null;
  follow_up_required?: boolean | null;
  follow_up_type?: FollowUpType | null;
  follow_up_date?: string | null;
  follow_up_status?: FollowUpStatus | null;
  quick_note?: string | null;
  brand_details?: BrandDetails | null;
  purpose_of_visit?: string | null;
  products_discussed?: string | null;
  feedback?: string | null;
  decision_maker_met?: boolean | null;
  decision_maker_name?: string | null;
  objections_raised?: string | null;
  next_steps?: string | null;
  manager_review?: string | null;
  next_year_target?: string | null;
  dsr_status?: "open" | "closed" | "on_hold" | null;
  assigned_date: string;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  remarks: string | null;
  blockers: string | null;
  completion_note: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskStatusAudit = {
  id: string;
  task_id: string;
  changed_by: string | null;
  old_status: Status;
  new_status: Status;
  change_note: string | null;
  changed_at: string;
};

export type ActivityEvent = {
  id: string;
  actor_user_id: string | null;
  institution_id: string | null;
  visit_task_id: string | null;
  event_type: string;
  event_summary: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SyncState = "synced" | "pending" | "failed";

export type NotificationSeverity = "low" | "medium" | "high";
export type NotificationType = "follow_up" | "visit" | "admin_alert" | "system_suggestion" | "automation";
export type NotificationItem = {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  action_url: string | null;
  related_visit_task_id: string | null;
  related_institution_id: string | null;
  metadata: Record<string, unknown> | null;
  dedupe_fingerprint: string | null;
  is_read: boolean;
  is_push_sent: boolean;
  push_sent_at: string | null;
  created_at: string;
  read_at: string | null;
};

export type NotificationPrefs = {
  in_app_enabled: boolean;
  push_enabled: boolean;
  follow_up_reminders: boolean;
  visit_reminders: boolean;
  morning_summary: boolean;
  admin_overdue_alerts: boolean;
  admin_inactive_institution_alerts: boolean;
  admin_inactive_employee_alerts: boolean;
  admin_stale_pipeline_alerts: boolean;
};

export type InstitutionConflictSignal = {
  userId: string;
  fullName: string;
  visitStatus: string | null;
  updatedAt: string | null;
};

export type AutomationSettings = {
  high_interest_inactive_days: number;
  proposal_stale_days: number;
  demo_stale_days: number;
  inactive_employee_days: number;
  incomplete_visit_hours: number;
  push_jobs_enabled: boolean;
  in_app_alerts_enabled: boolean;
  auto_followup_tasks_enabled: boolean;
  auto_stage_suggestions_enabled: boolean;
  public_team_ongoing_meetings: boolean;
  morning_summary_time: string;
  admin_digest_time: string;
};

export type TaskDraft = {
  taskCategory: TaskCategory;
  taskTitle: string;
  description: string;
  taskType: TaskType;
  priority: Priority;
  status: Status;
  visitBrand: VisitBrand;
  institutionType: InstitutionType;
  institutionName: string;
  institutionId: string;
  visitDate: string;
  visitStatus: VisitStatus;
  assignedDate: string;
  dueDate: string;
  remarks: string;
  blockers: string;
  completionNote: string;
  brandDetails: BrandDetails;
};

export type ImportRow = {
  date: string;
  weekday: string;
  theme: string;
  slot9451015: string;
  slot10201220: string;
  slot200300: string;
  slot300530: string;
  slot530600: string;
  evening: string;
  notes: string;
};

export type OfficeInvite = {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  role: Role;
  status: "pending" | "accepted" | "revoked";
  invited_at: string;
};

export type ImportHistory = {
  id: string;
  imported_by: string;
  imported_for: string;
  source_file: string | null;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  notes: string | null;
  created_at: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  text: string;
  author: string;
  createdAt: string;
};

export type ConversationType = "direct" | "group" | "announcement";
export type ConversationMemberRole = "member" | "admin" | "moderator";
export type PresenceStatus = "available" | "busy" | "in_field" | "in_meeting" | "offline";
export type AnnouncementAckStatus = "seen" | "understood";

export type MessengerConversation = {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_archived: boolean;
  my_member_role: ConversationMemberRole;
  my_last_read_message_id: string | null;
  member_user_ids: string[];
  unread_count: number;
  last_message_body: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  settings?: Record<string, unknown> | null;
  is_pinned?: boolean;
  my_is_muted?: boolean;
};

export type MessengerMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: "text" | "system" | "linked_record" | "announcement";
  body: string | null;
  created_at: string;
  edited_at?: string | null;
  reply_to_message_id?: string | null;
  linked_entity_type?: "task" | "visit" | "institution" | null;
  linked_entity_id?: string | null;
  metadata?: Record<string, unknown>;
  deleted_at?: string | null;
};

export type MessengerConversationMember = {
  conversation_id: string;
  user_id: string;
  role: ConversationMemberRole;
  is_muted?: boolean;
  last_read_message_id?: string | null;
};

export const initialDraft: TaskDraft = {
  taskCategory: "general",
  taskTitle: "",
  description: "",
  taskType: "planned",
  priority: "medium",
  status: "not_started",
  visitBrand: "Vivencia",
  institutionType: "School",
  institutionName: "",
  institutionId: "",
  visitDate: new Date().toISOString().slice(0, 10),
  visitStatus: "planned",
  assignedDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  remarks: "",
  blockers: "",
  completionNote: "",
  brandDetails: {},
};

export const defaultNotificationPrefs: NotificationPrefs = {
  in_app_enabled: true,
  push_enabled: false,
  follow_up_reminders: true,
  visit_reminders: true,
  morning_summary: true,
  admin_overdue_alerts: true,
  admin_inactive_institution_alerts: true,
  admin_inactive_employee_alerts: true,
  admin_stale_pipeline_alerts: true,
};

export const defaultAutomationSettings: AutomationSettings = {
  high_interest_inactive_days: 3,
  proposal_stale_days: 3,
  demo_stale_days: 3,
  inactive_employee_days: 2,
  incomplete_visit_hours: 2,
  push_jobs_enabled: false,
  in_app_alerts_enabled: true,
  auto_followup_tasks_enabled: true,
  auto_stage_suggestions_enabled: true,
  public_team_ongoing_meetings: false,
  morning_summary_time: "09:00",
  admin_digest_time: "18:00",
};

export const defaultVisitSectionState: VisitSectionState = {
  journey_workflow: false,
  institution_search: false,
  institution_summary: false,
  visit_history: false,
  visit_outcome: false,
  next_action: false,
  follow_up: false,
  quick_note: false,
  brand_details: false,
};
