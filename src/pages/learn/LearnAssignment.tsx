import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, Upload, CheckCircle2, Clock, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import {
  lmsGetAssignmentForLesson,
  lmsSubmitAssignment,
  type LmsAssignment,
  type LmsSubmission,
} from "@/lib/lmsClient";

const CLOUDINARY_CLOUD = "dumpn4wcq";
const CLOUDINARY_PRESET = "onrol_hub_unsigned";

async function uploadAttachment(file: File): Promise<{ url: string; name: string; type: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_PRESET);
  form.append("folder", "onrol_lms/submissions");
  const resourceType = file.type.startsWith("image/") ? "image"
    : file.type.startsWith("video/") ? "video" : "raw";
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, {
    method: "POST",
    body: form,
  });
  if (!r.ok) throw new Error("Upload failed");
  const { secure_url } = await r.json() as { secure_url: string };
  return { url: secure_url, name: file.name, type: file.type };
}

interface Props {
  courseSlug: string;
  lessonId: string;
}

export default function LearnAssignment({ courseSlug, lessonId }: Props) {
  const { user } = useLmsAuth();
  const [assignment, setAssignment] = useState<LmsAssignment | null>(null);
  const [submission, setSubmission] = useState<LmsSubmission | null>(null);
  const [bodyMd, setBodyMd] = useState("");
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; type: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await lmsGetAssignmentForLesson(lessonId, user.id);
        if (cancelled) return;
        if (!r) {
          toast.error("Assignment not configured yet.");
          return;
        }
        setAssignment(r.assignment);
        setSubmission(r.submission);
        if (r.submission) {
          setBodyMd(r.submission.body_md ?? "");
          setAttachments(r.submission.attachments as Array<{ url: string; name: string; type: string }>);
        }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load assignment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId, user]);

  const addFile = async (file: File) => {
    setUploading(true);
    try {
      const att = await uploadAttachment(file);
      setAttachments((prev) => [...prev, att]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!assignment || !user) return;
    setSubmitting(true);
    try {
      const out = await lmsSubmitAssignment({
        assignmentId: assignment.id,
        userExternalId: user.id,
        bodyMd: bodyMd || null,
        attachments,
      });
      setSubmission(out);
      toast.success("Submitted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div>;
  if (!assignment) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Assignment not available.</div>;

  const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
  const isOverdue = dueDate ? new Date() > dueDate : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to={`/learn/c/${courseSlug}`} className="inline-flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900 dark:hover:text-slate-100">
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Link>

      <h1 className="text-2xl font-bold">{assignment.title}</h1>
      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
        <span>Max points: {assignment.max_points}</span>
        {dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600" : ""}`}>
            <Clock className="h-4 w-4" />
            Due {dueDate.toLocaleDateString()} {isOverdue && "(late)"}
          </span>
        )}
      </div>

      {assignment.instructions_md && (
        <div className="prose prose-slate dark:prose-invert max-w-none mt-6">
          {assignment.instructions_md.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}

      {assignment.rubric_md && (
        <div className="mt-4 rounded-lg border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#f3f5f8] p-4">
          <h3 className="text-sm font-semibold mb-2">Grading rubric</h3>
          <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
            {assignment.rubric_md.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      )}

      {submission && submission.status === "graded" && (
        <div className="mt-6 rounded-lg border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950 p-4">
          <div className="flex items-center gap-2 font-medium text-green-900 dark:text-green-100">
            <CheckCircle2 className="h-5 w-5" />
            Grade: {submission.grade_points}/{assignment.max_points} points
          </div>
          {submission.grade_feedback_md && (
            <div className="prose prose-slate dark:prose-invert prose-sm mt-2 max-w-none">
              {submission.grade_feedback_md.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-5">
        <h3 className="font-semibold mb-3">Your submission</h3>
        {submission && (
          <div className="text-xs text-slate-500 mb-3">
            Last submitted {new Date(submission.submitted_at).toLocaleString()}
            {submission.is_late && <span className="text-red-600 ml-2">LATE</span>}
            <span className="ml-2">Status: {submission.status}</span>
          </div>
        )}
        <label className="block text-sm">
          <span className="font-medium">Response (Markdown)</span>
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            rows={8}
            className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8] font-mono text-xs"
            placeholder="Write your answer here…"
            disabled={submitting}
          />
        </label>

        <div className="mt-4">
          <span className="block text-sm font-medium mb-2">Attachments</span>
          <ul className="space-y-1 text-sm">
            {attachments.map((a, i) => (
              <li key={i} className="flex items-center gap-2 px-3 py-2 rounded border border-slate-200 dark:border-[#454545]">
                <a href={a.url} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline flex-1 truncate">
                  {a.name}
                </a>
                <button onClick={() => removeAttachment(i)} className="text-xs text-red-600">Remove</button>
              </li>
            ))}
          </ul>
          <label className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-slate-300 dark:border-[#454545] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#404040] text-sm">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Add file"}
            <input
              type="file"
              className="hidden"
              disabled={uploading || submitting}
              onChange={(e) => e.target.files?.[0] && addFile(e.target.files[0])}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={submit}
            disabled={submitting || (!bodyMd && attachments.length === 0) || (isOverdue && !assignment.allow_late)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting…" : submission ? "Resubmit" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
