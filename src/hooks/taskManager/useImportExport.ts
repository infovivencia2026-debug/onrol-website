import { useState, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { tmCreateTask } from "@/lib/tmClient";
import { parseScheduleText } from "@/utils/taskManager";
import type { OfficeUser, ImportRow, ImportHistory, TaskCategory, TaskType, Priority, Status } from "@/types/taskManager";
import { getErrorMessage } from "@/utils/taskManager";

interface UseImportExportReturn {
  showImportPanel: boolean;
  setShowImportPanel: React.Dispatch<React.SetStateAction<boolean>>;
  importRows: ImportRow[];
  setImportRows: React.Dispatch<React.SetStateAction<ImportRow[]>>;
  importError: string | null;
  setImportError: React.Dispatch<React.SetStateAction<string | null>>;
  importing: boolean;
  setImporting: React.Dispatch<React.SetStateAction<boolean>>;
  importFileName: string;
  setImportFileName: React.Dispatch<React.SetStateAction<string>>;
  importHistory: ImportHistory[];
  setImportHistory: React.Dispatch<React.SetStateAction<ImportHistory[]>>;
  handleImportFile: (file: File) => Promise<void>;
  applyImport: () => Promise<void>;
  exportTasksCsv: (tasks: Array<Record<string, unknown>>) => void;
}

export default function useImportExport(
  officeUser: OfficeUser | null,
  refreshTasks: (options?: { showLoading?: boolean }) => Promise<void>,
): UseImportExportReturn {
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);

  const handleImportFile = useCallback(async (file: File) => {
    setImportError(null);
    setImportFileName(file.name);
    const extension = file.name.toLowerCase().split(".").pop();
    let text = "";
    if (extension === "xlsx" || extension === "xls") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setImportRows([]);
        setImportError("Workbook has no sheets.");
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      text = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      text = await file.text();
    }
    const parsed = parseScheduleText(text);
    if ("error" in parsed && parsed.error) {
      setImportRows([]);
      setImportError(parsed.error);
      return;
    }
    setImportRows(parsed.rows);
    if (!parsed.rows.length) {
      setImportError("No valid rows found. Ensure Date and Theme are filled.");
    }
  }, []);

  const applyImport = useCallback(async () => {
    if (!officeUser || !importRows.length) return;
    setImporting(true);
    try {
      const payload = importRows.map((row) => {
        const scheduleDescription = [
          `Weekday: ${row.weekday || "-"}`,
          `Theme: ${row.theme}`,
          `9:45-10:15: ${row.slot9451015 || "-"}`,
          `10:20-12:20: ${row.slot10201220 || "-"}`,
          `2:00-3:00: ${row.slot200300 || "-"}`,
          `3:00-5:30 (Heavy Ops): ${row.slot300530 || "-"}`,
          `5:30-6:00: ${row.slot530600 || "-"}`,
          `Evening: ${row.evening || "-"}`,
        ].join("\n");

        return {
          user_id: officeUser.id,
          task_title: `${row.theme} - ${row.weekday || "Schedule"}`,
          description: scheduleDescription,
          task_category: "general" as TaskCategory,
          task_type: "planned" as TaskType,
          priority: row.slot300530 ? ("high" as Priority) : ("medium" as Priority),
          status: "not_started" as Status,
          visit_brand: null,
          institution_type: null,
          institution_name: null,
          institution_id: null,
          visit_date: null,
          visit_status: null,
          check_in_at: null,
          meeting_started_at: null,
          meeting_completed_at: null,
          check_out_at: null,
          check_in_latitude: null,
          check_in_longitude: null,
          check_in_address: null,
          check_in_city: null,
          check_in_area: null,
          check_in_maps_link: null,
          check_in_location_at: null,
          visit_outcome: null,
          follow_up_required: null,
          follow_up_type: null,
          follow_up_date: null,
          follow_up_status: null,
          quick_note: null,
          brand_details: null,
          assigned_date: row.date,
          due_date: row.date,
          remarks: row.notes || null,
          blockers: null,
          completion_note: null,
        };
      });

      // The CRM /api/tm/tasks endpoint only supports single-row creates;
      // sequential calls keep error handling per-row but stay efficient for
      // the typical import size (well under 100 rows).
      let inserted = 0;
      for (const row of payload) {
        try {
          await tmCreateTask(row as unknown as Record<string, unknown>);
          inserted += 1;
        } catch {
          // continue — best-effort row-level resilience for bulk imports
        }
      }
      if (!inserted) throw new Error("No rows could be imported.");
      // Server-side import history audit log is owned by the CRM (not yet
      // exposed via a write endpoint); the client no longer attempts to
      // write it directly.
      toast.success(`Imported ${payload.length} tasks.`);
      setImportRows([]);
      setShowImportPanel(false);
      await refreshTasks();
    } catch (error: unknown) {
      setImportError(getErrorMessage(error, "Unable to import file."));
      toast.error(getErrorMessage(error, "Unable to import file."));
    } finally {
      setImporting(false);
    }
  }, [officeUser, importRows, refreshTasks]);

  const exportTasksCsv = useCallback(
    (tasks: Array<Record<string, unknown>>) => {
      const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const visitOutcomeLabels: Record<string, string> = {
        interested: "Interested",
        need_proposal: "Need Proposal",
        need_demo: "Need Demo",
        call_later: "Call Later",
        not_interested: "Not Interested",
        revisit_required: "Revisit Required",
        met_wrong_person: "Met Wrong Person",
        decision_maker_not_available: "Decision Maker N/A",
      };
      const followUpTypeLabels: Record<string, string> = {
        call: "Call",
        whatsapp: "WhatsApp",
        email: "Email",
        visit: "Visit",
        demo: "Demo",
        proposal: "Proposal",
      };
      const dsrStatusLabels: Record<string, string> = {
        open: "Open",
        closed: "Closed",
        on_hold: "On Hold",
      };

      // DSR column layout (A–X) per admin report spec
      const headers = [
        "Month",
        "Date of Visit",
        "Employee Name",
        "Institution Name",
        "Strength",
        "Address",
        "Contact Person",
        "Designation",
        "Contact Number",
        "Email ID",
        "Purpose of Visit",
        "Products/Programs Discussed",
        "Feedback",
        "Decision Maker Met (Yes/No)",
        "Decision Maker Name",
        "Objections Raised",
        "Outcome of Visit",
        "Next Follow-Up Date",
        "Next Steps / Action Items",
        "Mode of Follow-Up",
        "Remarks / Notes",
        "Manager Review Comments",
        "Status (Open/Closed/On Hold)",
        "Next Year",
        "Quick Note",
        "Visit Status",
        "Visit Brand",
        "Institution Type",
        "Task Title",
        "Priority",
        "Check-in At",
        "Meeting Started At",
        "Meeting Completed At",
        "Check-out At",
        "Updated At",
      ];
      const rows = tasks.map((t) => {
        const visitDate = (t.visit_date as string) || (t.assigned_date as string) || "";
        const monthLabel = visitDate ? MONTHS[new Date(visitDate).getMonth()] || "" : "";
        const outcomes = ((t.visit_outcome as string[]) || [])
          .map((o) => visitOutcomeLabels[o] || o)
          .join(" | ");
        return [
          monthLabel,
          visitDate,
          (t.user_full_name as string) || "",
          (t.institution_name as string) || "",
          (t.institution_strength as string | number | null) ?? "",
          (t.institution_address as string) || (t.check_in_address as string) || "",
          (t.institution_contact_name as string) || "",
          (t.institution_contact_designation as string) || "",
          (t.institution_contact_phone as string) || "",
          (t.institution_contact_email as string) || "",
          (t.purpose_of_visit as string) || "",
          (t.products_discussed as string) || "",
          (t.feedback as string) || "",
          t.decision_maker_met === true ? "Yes" : t.decision_maker_met === false ? "No" : "",
          (t.decision_maker_name as string) || "",
          (t.objections_raised as string) || "",
          outcomes,
          (t.follow_up_date as string) || "",
          (t.next_steps as string) || "",
          t.follow_up_type ? followUpTypeLabels[t.follow_up_type as string] || (t.follow_up_type as string) : "",
          (t.remarks as string) || "",
          (t.manager_review as string) || "",
          t.dsr_status ? dsrStatusLabels[t.dsr_status as string] || (t.dsr_status as string) : "",
          (t.next_year_target as string) || "",
          (t.quick_note as string) || "",
          (t.visit_status as string) || "",
          (t.visit_brand as string) || "",
          (t.institution_type as string) || "",
          (t.task_title as string) || "",
          (t.priority as string) || "",
          (t.check_in_at as string) || "",
          (t.meeting_started_at as string) || "",
          (t.meeting_completed_at as string) || "",
          (t.check_out_at as string) || "",
          (t.updated_at as string) || "",
        ];
      });
      try {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        (sheet as unknown as Record<string, unknown>)["!freeze"] = { xSplit: 0, ySplit: 1 };
        (sheet as unknown as Record<string, unknown>)["!cols"] = headers.map((h) => ({
          wch: Math.min(36, Math.max(10, h.length + 2)),
        }));
        XLSX.utils.book_append_sheet(workbook, sheet, "DSR");
        const filename = `onrol-dsr-${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, filename);
        toast.success(`Exported ${rows.length} rows to ${filename}`);
      } catch (err) {
        toast.error(getErrorMessage(err, "Export failed."));
      }
    },
    [],
  );

  return {
    showImportPanel,
    setShowImportPanel,
    importRows,
    setImportRows,
    importError,
    setImportError,
    importing,
    setImporting,
    importFileName,
    setImportFileName,
    importHistory,
    setImportHistory,
    handleImportFile,
    applyImport,
    exportTasksCsv,
  };
}
