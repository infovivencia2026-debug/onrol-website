import { FormEvent, useState, useRef, useEffect } from "react";
import { SendHorizontal, X, Sparkles, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

const QUICK_ASKS = [
  "How long is the program?",
  "When's the next cohort?",
  "Do I need to know coding?",
  "What will I build?",
];

const XuloAssistant = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I'm XULO, ONROL's AI assistant. Ask me anything about programs, cohorts, outcomes, or how the 3-month career accelerator works.",
    },
  ]);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the conversation into view on every new message.
  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  const sendPrompt = async (prompt: string) => {
    if (!prompt || sending) return;
    const userMessage: ChatMessage = { id: Date.now(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("xulo-chat", {
        body: { prompt },
      });
      const reply: string =
        (typeof data === "object" && data && "response" in data && typeof data.response === "string"
          ? data.response
          : null) ||
        "I'm having trouble reaching the AI service right now. You can also reach the team via WhatsApp from the floating button below.";
      if (error) console.warn("xulo-chat error:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.warn("xulo-chat invoke failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "Something went wrong on my end. The team is reachable via the WhatsApp button or at info@onrol.in.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendPrompt(input.trim());
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-24 right-4 z-[70] inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 pl-3 pr-5 text-[13px] font-bold text-white shadow-[0_18px_36px_-10px_rgba(255,107,71,0.55)] transition hover:brightness-110 md:bottom-6 md:right-6"
        aria-label="Open XULO assistant"
        style={{ fontFamily: INTER_STACK }}
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-white/15">
          <Bot className="h-5 w-5" />
          <span aria-hidden className="absolute -right-0.5 -top-0.5 grid h-3 w-3 place-items-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#f3f5f8]" />
          </span>
        </span>
        <span className="hidden sm:inline">Ask XULO</span>
      </button>

      {/* Panel */}
      {open ? (
        <div
          className="fixed inset-x-3 bottom-24 z-[80] mx-auto w-auto max-w-[420px] overflow-hidden rounded-2xl border border-white/12 bg-[#f3f5f8]/96 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:inset-x-auto sm:right-4 sm:w-[min(92vw,420px)] md:bottom-28 md:right-6"
          style={{ fontFamily: INTER_STACK }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#f3f5f8] to-[#3f3f3f] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-white">XULO</p>
                <p className="-mt-0.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online · ONROL AI
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close XULO assistant"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollerRef} className="max-h-[60vh] min-h-[260px] space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                {message.role === "assistant" ? (
                  <div className="flex max-w-[85%] items-start gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-orange-500/15 text-orange-300">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                    <p className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-100/95">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-orange-500 to-orange-400 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white shadow-[0_10px_20px_-10px_rgba(255,107,71,0.55)]">
                    {message.content}
                  </p>
                )}
              </div>
            ))}

            {sending ? (
              <div className="flex items-center gap-2 px-1">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-500/15 text-orange-300">
                  <Bot className="h-3.5 w-3.5" />
                </span>
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-300/80 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-300/80 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-orange-300/80" />
                </span>
              </div>
            ) : null}

            {/* Quick-asks shown only when chat is fresh */}
            {messages.length === 1 && !sending ? (
              <div className="!mt-4 flex flex-wrap gap-2">
                {QUICK_ASKS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void sendPrompt(q)}
                    className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 text-[12px] text-slate-200 transition hover:border-orange-300/40 hover:bg-white/10"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Composer */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-white/10 bg-[#f3f5f8] px-3 py-3"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about programs, admissions, outcomes…"
              className="h-11 flex-1 rounded-xl border border-white/12 bg-white/[0.03] px-3.5 text-[13.5px] text-slate-100 placeholder:text-slate-400 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-[0_10px_22px_-8px_rgba(255,107,71,0.55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              <SendHorizontal size={16} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default XuloAssistant;
