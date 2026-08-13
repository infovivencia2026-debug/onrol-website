import { FormEvent, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { communitySupabase as supabase } from "@/lib/communitySupabase";

const categories = [
  "AI Tools",
  "AI News",
  "Daily Hacks",
  "Prompts",
  "Training Videos",
  "Workshops",
  "Courses",
  "Opportunities",
  "Resources",
  "Beginner Corner",
];

type SourceItem = {
  id: string;
  source_url: string;
  source_name: string | null;
  category: string;
  title_hint: string | null;
  excerpt_hint: string | null;
  status: string;
  queued_at: string;
};

type DraftItem = {
  id: string;
  source_id: string | null;
  category: string;
  title: string;
  description: string;
  status: string;
  scheduled_for: string | null;
  created_at: string;
};

export default function AdminContentPipeline() {
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceCategory, setSourceCategory] = useState("AI News");
  const [titleHint, setTitleHint] = useState("");
  const [excerptHint, setExcerptHint] = useState("");
  const [rawText, setRawText] = useState("");

  const [draftSourceId, setDraftSourceId] = useState("");
  const [draftCategory, setDraftCategory] = useState("AI News");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftContentHtml, setDraftContentHtml] = useState("");
  const [draftCtaText, setDraftCtaText] = useState("Read More");
  const [draftCtaLink, setDraftCtaLink] = useState("");
  const [draftEmoji, setDraftEmoji] = useState("AI");
  const [draftScheduleAt, setDraftScheduleAt] = useState("");

  const panel = "rounded-2xl border border-[#0B1640]/10 bg-[#232532]";
  const input =
    "h-10 w-full rounded-lg border border-[#0B1640]/12 bg-white px-3 text-sm text-slate-100 placeholder:text-[#0B1640]/55 focus:border-orange-300 focus:outline-none";

  const loadPipeline = async () => {
    setLoading(true);
    const [sourcesResult, draftsResult] = await Promise.all([
      supabase
        .from("community_content_sources")
        .select("id,source_url,source_name,category,title_hint,excerpt_hint,status,queued_at")
        .order("queued_at", { ascending: false })
        .limit(20),
      supabase
        .from("community_content_drafts")
        .select("id,source_id,category,title,description,status,scheduled_for,created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (sourcesResult.error) {
      toast.error(`Pipeline source load failed: ${sourcesResult.error.message}`);
    } else {
      setSources((sourcesResult.data ?? []) as SourceItem[]);
    }

    if (draftsResult.error) {
      toast.error(`Pipeline draft load failed: ${draftsResult.error.message}`);
    } else {
      setDrafts((draftsResult.data ?? []) as DraftItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const queueSource = async (event: FormEvent) => {
    event.preventDefault();
    if (!sourceUrl.trim()) {
      toast.error("Source URL is required.");
      return;
    }

    const { error } = await supabase.from("community_content_sources").insert({
      source_url: sourceUrl.trim(),
      source_name: sourceName.trim() || null,
      category: sourceCategory,
      title_hint: titleHint.trim() || null,
      excerpt_hint: excerptHint.trim() || null,
      raw_text: rawText.trim() || null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Source queued.");
    setSourceUrl("");
    setSourceName("");
    setTitleHint("");
    setExcerptHint("");
    setRawText("");
    await loadPipeline();
  };

  const createDraft = async (event: FormEvent) => {
    event.preventDefault();
    if (!draftTitle.trim() || !draftDescription.trim() || !draftContentHtml.trim()) {
      toast.error("Title, description, and content are required.");
      return;
    }

    const sourceRef = draftSourceId.trim() || null;
    const { error } = await supabase.from("community_content_drafts").insert({
      source_id: sourceRef,
      category: draftCategory,
      title: draftTitle.trim(),
      description: draftDescription.trim(),
      content_html: draftContentHtml.trim(),
      cta_text: draftCtaText.trim() || null,
      cta_link: draftCtaLink.trim() || null,
      thumbnail_emoji: draftEmoji.trim() || null,
      status: "draft",
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (sourceRef) {
      await supabase
        .from("community_content_sources")
        .update({ status: "drafted", drafted_at: new Date().toISOString() })
        .eq("id", sourceRef);
    }

    toast.success("Draft created.");
    setDraftSourceId("");
    setDraftTitle("");
    setDraftDescription("");
    setDraftContentHtml("");
    setDraftCtaLink("");
    await loadPipeline();
  };

  const publishDraft = async (draftId: string, publishNow: boolean) => {
    const schedule = !publishNow && draftScheduleAt ? new Date(draftScheduleAt).toISOString() : null;
    const { error } = await supabase.rpc("publish_content_draft", {
      p_draft_id: draftId,
      p_publish_now: publishNow,
      p_publish_at: schedule,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(publishNow ? "Draft published." : "Draft scheduled.");
    await loadPipeline();
  };

  const runScheduler = async () => {
    const { error } = await supabase.rpc("publish_due_posts");
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Scheduler executed for due posts.");
    await loadPipeline();
  };

  return (
    <section className="space-y-4">
      <div className={`${panel} p-4 md:p-5`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold onrol-heading-gradient-dark">Admin Content Pipeline</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={runScheduler}
              className="rounded-lg border border-[#0B1640]/15 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
            >
              Run Scheduler
            </button>
            <button
              onClick={loadPipeline}
              className="inline-flex items-center gap-2 rounded-lg border border-[#0B1640]/15 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/15"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <form onSubmit={queueSource} className={`${panel} space-y-3 p-4 md:p-5`}>
          <h3 className="text-sm font-semibold text-slate-100">1. Queue Source</h3>
          <input className={input} placeholder="Source URL" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          <input className={input} placeholder="Source Name (optional)" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
          <select className={input} value={sourceCategory} onChange={(e) => setSourceCategory(e.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input className={input} placeholder="Title hint" value={titleHint} onChange={(e) => setTitleHint(e.target.value)} />
          <textarea
            className="min-h-[74px] w-full rounded-lg border border-[#0B1640]/12 bg-white px-3 py-2 text-sm text-slate-100 placeholder:text-[#0B1640]/55 focus:border-orange-300 focus:outline-none"
            placeholder="Excerpt / notes"
            value={excerptHint}
            onChange={(e) => setExcerptHint(e.target.value)}
          />
          <textarea
            className="min-h-[100px] w-full rounded-lg border border-[#0B1640]/12 bg-white px-3 py-2 text-sm text-slate-100 placeholder:text-[#0B1640]/55 focus:border-orange-300 focus:outline-none"
            placeholder="Optional raw source text"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
          <button className="rounded-lg bg-[#F5F5F4] px-4 py-2 text-sm font-semibold text-[#f3f5f8]">Queue Source</button>
        </form>

        <form onSubmit={createDraft} className={`${panel} space-y-3 p-4 md:p-5`}>
          <h3 className="text-sm font-semibold text-slate-100">2. Create Draft</h3>
          <input className={input} placeholder="Source ID (optional)" value={draftSourceId} onChange={(e) => setDraftSourceId(e.target.value)} />
          <select className={input} value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input className={input} placeholder="Post title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
          <input className={input} placeholder="Short description" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} />
          <textarea
            className="min-h-[126px] w-full rounded-lg border border-[#0B1640]/12 bg-white px-3 py-2 text-sm text-slate-100 placeholder:text-[#0B1640]/55 focus:border-orange-300 focus:outline-none"
            placeholder="HTML content body"
            value={draftContentHtml}
            onChange={(e) => setDraftContentHtml(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={input} placeholder="CTA text" value={draftCtaText} onChange={(e) => setDraftCtaText(e.target.value)} />
            <input className={input} placeholder="CTA link" value={draftCtaLink} onChange={(e) => setDraftCtaLink(e.target.value)} />
            <input className={input} placeholder="Emoji" value={draftEmoji} onChange={(e) => setDraftEmoji(e.target.value)} />
          </div>
          <button className="rounded-lg bg-[#F5F5F4] px-4 py-2 text-sm font-semibold text-[#f3f5f8]">Save Draft</button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`${panel} p-4 md:p-5`}>
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Queued Sources</h3>
          <div className="space-y-2">
            {sources.length === 0 ? <p className="text-sm text-[#0B1640]/55">No queued sources.</p> : null}
            {sources.map((source) => (
              <article key={source.id} className="rounded-lg border border-[#0B1640]/10 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-orange-600">{source.category}</p>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-100">{source.title_hint || source.source_name || source.source_url}</p>
                <p className="mt-1 line-clamp-1 text-xs text-[#0B1640]/75">{source.source_url}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-[#0B1640]/55">
                  <span>{source.status}</span>
                  <span>{new Date(source.queued_at).toLocaleString()}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={`${panel} p-4 md:p-5`}>
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Drafts & Publish</h3>
          <input
            type="datetime-local"
            value={draftScheduleAt}
            onChange={(e) => setDraftScheduleAt(e.target.value)}
            className={`${input} mb-3`}
          />
          <div className="space-y-2">
            {drafts.length === 0 ? <p className="text-sm text-[#0B1640]/55">No drafts available.</p> : null}
            {drafts.map((draft) => (
              <article key={draft.id} className="rounded-lg border border-[#0B1640]/10 bg-white p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-orange-600">{draft.category}</p>
                <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-100">{draft.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-[#0B1640]/75">{draft.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => publishDraft(draft.id, true)}
                    className="rounded-md bg-[#F5F5F4] px-2.5 py-1.5 text-xs font-semibold text-[#f3f5f8]"
                  >
                    Publish Now
                  </button>
                  <button
                    onClick={() => publishDraft(draft.id, false)}
                    className="rounded-md border border-[#0B1640]/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-100"
                  >
                    Schedule
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#0B1640]/55">
                  <span>{draft.status}</span>
                  <span>{new Date(draft.created_at).toLocaleString()}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

