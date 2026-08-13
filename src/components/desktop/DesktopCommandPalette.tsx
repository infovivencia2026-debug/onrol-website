import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { isDesktopRuntime } from "@/lib/desktopBridge";

type ActionItem = {
  id: string;
  label: string;
  subtitle: string;
  run: () => void;
};

export default function DesktopCommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions = useMemo<ActionItem[]>(
    () => [
      { id: "dashboard", label: "Open Dashboard", subtitle: "Overview", run: () => navigate("/task/overview") },
      { id: "tasks", label: "Open Tasks", subtitle: "Task list", run: () => navigate("/task/tasks") },
      { id: "journey", label: "Open Journey Planner", subtitle: "Plan visits", run: () => navigate("/task/journey") },
      { id: "chat", label: "Open Chat", subtitle: "Messenger inbox", run: () => navigate("/messenger/inbox") },
      { id: "meeting", label: "Open Meetings", subtitle: "Meeting workspace", run: () => navigate("/task/app?section=meeting") },
      { id: "new-task", label: "Create Task", subtitle: "Quick create form", run: () => navigate("/task/tasks?openCreate=1") },
      { id: "institutions", label: "Open Institutions", subtitle: "Institution CRM", run: () => navigate("/task/institutions") },
    ],
    [navigate],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === "k";
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isDesktopRuntime()) return undefined;
    const offShortcut = window.desktopAPI!.onShortcut(({ action }) => {
      if (action === "open-command-palette") setOpen(true);
    });
    return offShortcut;
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[12000] bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-[10vh] w-[min(720px,94vw)] rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <Command className="w-full">
          <Command.Input className="h-12 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm text-slate-100 outline-none" placeholder="Search tasks, conversations, actions..." />
          <Command.List className="mt-2 max-h-[60vh] overflow-auto">
            {actions.map((item) => (
              <Command.Item
                key={item.id}
                onSelect={() => {
                  item.run();
                  setOpen(false);
                }}
                className="group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-200 data-[selected=true]:bg-cyan-700/25"
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400 group-data-[selected=true]:text-orange-200">{item.subtitle}</span>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

