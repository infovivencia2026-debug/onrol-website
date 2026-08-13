"use client";

import React, { useState } from "react";
import {
  X, Calendar, Clock, Users, Plus, Loader, CheckCircle, Copy,
} from "lucide-react";
import { toast } from "sonner";
import type { OfficeUser } from "@/types/taskManager";
import type { Meeting } from "@/types/meeting";

const MEETING_CACHE_KEY = "task-meetings-cache-v1";

interface MeetingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  officeUser: OfficeUser;
  accessToken?: string | null;
  teamMembers?: OfficeUser[];
  onMeetingCreated?: (meeting: Meeting) => void;
}

export const MeetingCreateModal: React.FC<MeetingCreateModalProps> = ({
  isOpen,
  onClose,
  officeUser,
  accessToken,
  teamMembers = [],
  onMeetingCreated,
}) => {
  const [step, setStep] = useState<"type" | "details" | "success">("type");
  const [meetingType, setMeetingType] = useState<"instant" | "scheduled">("instant");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledStart: "",
    scheduledEnd: "",
    maxParticipants: 100,
    selectedParticipants: [] as string[],
  });
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");

  const cacheMeeting = (meeting: Meeting) => {
    try {
      const raw = window.localStorage.getItem(MEETING_CACHE_KEY);
      const current = raw ? (JSON.parse(raw) as Meeting[]) : [];
      const next = [meeting, ...current.filter((m) => m.id !== meeting.id)].slice(0, 100);
      window.localStorage.setItem(MEETING_CACHE_KEY, JSON.stringify(next));
    } catch {
      // ignore cache write errors
    }
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast.error("Meeting title is required");
      return;
    }

    if (meetingType === "scheduled") {
      if (!formData.scheduledStart || !formData.scheduledEnd) {
        toast.error("Start and end schedule are required");
        return;
      }
      const startTs = new Date(formData.scheduledStart).getTime();
      const endTs = new Date(formData.scheduledEnd).getTime();
      if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) {
        toast.error("End time must be after start time");
        return;
      }
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title,
        description: formData.description,
        meeting_type: meetingType,
        ...(meetingType === "scheduled" && {
          scheduled_start: formData.scheduledStart,
          scheduled_end: formData.scheduledEnd,
        }),
        max_participants: formData.maxParticipants,
        participant_ids: formData.selectedParticipants,
      };

      if (!accessToken) throw new Error("Sign-in required to create a meeting.");
      const response = await fetch("/api/meetings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("application/json")) {
        const errorPayload = contentType.includes("application/json")
          ? await response.json().catch(() => ({}))
          : {};
        const message = typeof (errorPayload as { error?: unknown })?.error === "string"
          ? (errorPayload as { error: string }).error
          : "Failed to create meeting";
        throw new Error(message);
      }
      const meeting = (await response.json()) as Meeting;
      if (!meeting) throw new Error("Failed to create meeting");

      cacheMeeting(meeting);
      setCreatedMeeting(meeting);
      setStep("success");
      onMeetingCreated?.(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      const message = error instanceof Error && error.message
        ? error.message
        : "Failed to create meeting";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("type");
    setFormData({
      title: "",
      description: "",
      scheduledStart: "",
      scheduledEnd: "",
      maxParticipants: 100,
      selectedParticipants: [],
    });
    setInviteQuery("");
    setCreatedMeeting(null);
    onClose();
  };

  if (!isOpen) return null;

  const inviteCandidates = teamMembers
    .filter((member) => member.id !== officeUser.id && member.is_active !== false)
    .filter((member) => {
      const q = inviteQuery.trim().toLowerCase();
      if (!q) return true;
      const haystack = `${member.full_name || ""} ${member.email || ""}`.toLowerCase();
      return haystack.includes(q);
    });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>

        {/* Step 1: Choose Type */}
        {step === "type" && (
          <div className="space-y-4 p-6">
            <h2 className="text-2xl font-bold text-slate-900">New Meeting</h2>
            <p className="text-sm text-slate-600">What would you like to do?</p>

            <div className="space-y-3 pt-4">
              <button
                onClick={() => {
                  setMeetingType("instant");
                  setStep("details");
                }}
                className="w-full rounded-xl border-2 border-slate-300 p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="flex items-start gap-3">
                  <Plus size={20} className="text-indigo-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Start Instantly</p>
                    <p className="text-xs text-slate-600">Begin a meeting right now</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setMeetingType("scheduled");
                  setStep("details");
                }}
                className="w-full rounded-xl border-2 border-slate-300 p-4 text-left transition-colors hover:border-orange-300 hover:bg-blue-50"
              >
                <div className="flex items-start gap-3">
                  <Calendar size={20} className="text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Schedule for Later</p>
                    <p className="text-xs text-slate-600">Plan a meeting for specific date/time</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <div className="space-y-4 p-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {meetingType === "instant" ? "Start Meeting" : "Schedule Meeting"}
              </h2>
              <p className="text-sm text-slate-600 mt-1">Add meeting details</p>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team Standup"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Add notes about this meeting..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Date/Time (for scheduled) */}
              {meetingType === "scheduled" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.scheduledStart.split("T")[0] || ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          const [, time] = formData.scheduledStart.split("T");
                          setFormData({
                            ...formData,
                            scheduledStart: `${date}T${time || "14:00"}`,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={formData.scheduledStart.split("T")[1] || "14:00"}
                        onChange={(e) => {
                          const [date] = formData.scheduledStart.split("T");
                          setFormData({
                            ...formData,
                            scheduledStart: `${date || new Date().toISOString().split("T")[0]}T${e.target.value}`,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.scheduledEnd.split("T")[0] || formData.scheduledStart.split("T")[0]}
                        onChange={(e) => {
                          const date = e.target.value;
                          const [, time] = formData.scheduledEnd.split("T");
                          setFormData({
                            ...formData,
                            scheduledEnd: `${date}T${time || "15:00"}`,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={formData.scheduledEnd.split("T")[1] || "15:00"}
                        onChange={(e) => {
                          const [date] = formData.scheduledEnd.split("T");
                          const [fallbackDate] = formData.scheduledStart.split("T");
                          setFormData({
                            ...formData,
                            scheduledEnd: `${date || fallbackDate || new Date().toISOString().split("T")[0]}T${e.target.value}`,
                          });
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Max Participants */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Participants
                </label>
                <select
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>

              {/* Invite teammates */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Invite Teammates (optional)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {formData.selectedParticipants.length} selected
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Search teammate name or email"
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
                />
                <div className="max-h-28 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {inviteCandidates.length === 0 ? (
                    <p className="px-1 py-1 text-xs text-slate-500">No teammates found</p>
                  ) : (
                    inviteCandidates.slice(0, 40).map((member) => {
                      const selected = formData.selectedParticipants.includes(member.id);
                      return (
                        <label
                          key={member.id}
                          className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-white"
                        >
                          <span className="min-w-0 pr-2">
                            <span className="block truncate font-medium text-slate-900">
                              {member.full_name || member.email}
                            </span>
                            {member.email ? (
                              <span className="block truncate text-[11px] text-slate-500">{member.email}</span>
                            ) : null}
                          </span>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                selectedParticipants: selected
                                  ? prev.selectedParticipants.filter((id) => id !== member.id)
                                  : [...prev.selectedParticipants, member.id],
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setStep("type")}
                disabled={loading}
                className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !formData.title.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Create
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === "success" && createdMeeting && (
          <div className="space-y-4 p-6 text-center">
            <div className="flex justify-center">
              <CheckCircle size={48} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Meeting Created!</h2>

            {/* Meeting Code */}
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="text-xs text-slate-600 mb-2">Meeting Code</p>
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xl font-bold text-slate-900">
                  {createdMeeting.code}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdMeeting.code);
                    toast.success("Code copied!");
                  }}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Copy size={16} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="text-sm text-slate-600">
              {createdMeeting.meeting_type === "instant" ? (
                <p>✓ Meeting is ready to start</p>
              ) : (
                <p>✓ Meeting scheduled for {new Date(createdMeeting.scheduled_start!).toLocaleString()}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <button
                onClick={() => {
                  if (createdMeeting.meeting_type === "instant") {
                    window.location.href = `/meeting/join/${createdMeeting.code}`;
                  } else {
                    handleClose();
                  }
                }}
                className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {createdMeeting.meeting_type === "instant" ? "Join Meeting Now" : "Done"}
              </button>
              {createdMeeting.meeting_type === "instant" && (
                <button
                  onClick={handleClose}
                  className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingCreateModal;
