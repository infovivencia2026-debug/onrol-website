import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { isDesktopRuntime } from "@/lib/desktopBridge";

export default function DesktopRuntimeBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isDesktopRuntime()) return undefined;

    const offRoute = window.desktopAPI!.onRouteAction(({ action }) => {
      if (action === "open-dashboard") navigate("/task/overview");
      if (action === "open-tasks") navigate("/task/tasks");
      if (action === "open-chat") navigate("/messenger/inbox");
      if (action === "open-meeting") navigate("/task/app?section=meeting");
      if (action === "new-task") navigate("/task/tasks?openCreate=1");
    });

    const offNotif = window.desktopAPI!.onNotificationAction(({ route }) => {
      if (route) navigate(route);
    });

    const offUpdate = window.desktopAPI!.onUpdateState((state) => {
      const status = String(state?.status || "idle");
      const message = String(state?.message || "");
      if (status === "available") toast.info(message || "Desktop update available.");
      if (status === "ready") toast.success(message || "Update ready. Restart to install.");
      if (status === "error") toast.error(message || "Desktop update failed.");
    });

    return () => {
      offRoute();
      offNotif();
      offUpdate();
    };
  }, [navigate]);

  return null;
}

