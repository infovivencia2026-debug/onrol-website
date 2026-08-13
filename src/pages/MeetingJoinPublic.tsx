import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Video, LogIn, Copy, Check } from "lucide-react";

export default function MeetingJoinPublic() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const upperCode = code?.toUpperCase() ?? "";
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  // If the user is already logged in, redirect them into the app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Already authenticated — drop them straight into the meeting
        navigate(`/meeting/join/${upperCode}`, { replace: true });
      } else {
        setChecking(false);
      }
    }).catch(() => setChecking(false));
  }, [upperCode, navigate]);

  const handleJoin = () => {
    // Store pending code so TaskManager auto-joins after login
    if (upperCode) sessionStorage.setItem("pendingMeetingCode", upperCode);
    navigate("/task");
  };

  const handleCopy = () => {
    const link = `${window.location.origin}/meeting/join/${upperCode}`;
    void navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const shareLink = `${window.location.origin}/meeting/join/${upperCode}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#f3f5f8] to-[#f3f5f8] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-indigo-700/40 bg-[#f3f5f8]/80 p-8 shadow-2xl backdrop-blur">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <Video className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Header */}
        <h1 className="text-center text-2xl font-bold tracking-tight text-white">
          You're invited to a meeting
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Someone shared this meeting link with you.
        </p>

        {/* Meeting code badge */}
        <div className="mt-6 rounded-2xl border border-indigo-700/50 bg-[#f3f5f8]/60 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Meeting code
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-white">
            {upperCode}
          </p>
        </div>

        {/* Copy link */}
        <button
          onClick={handleCopy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#454545] bg-[#404040] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-[#454545] active:scale-95"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link copied!" : "Copy meeting link"}
        </button>

        {/* Join button */}
        <button
          onClick={handleJoin}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-all hover:bg-indigo-500 active:scale-95"
        >
          <LogIn className="h-4 w-4" />
          Sign in to join
        </button>

        <p className="mt-5 text-center text-xs text-slate-500">
          Sign in with your Onrol account to join this video meeting.
          <br />
          <span className="text-slate-600">Meeting link: {shareLink}</span>
        </p>
      </div>
    </div>
  );
}
