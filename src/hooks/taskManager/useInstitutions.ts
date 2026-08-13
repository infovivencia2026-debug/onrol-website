import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  tmCreateInstitution,
  tmBulkUpsertInstitutions,
  tmUpdateTask,
  tmListInstitutionHandlers,
  tmListInstitutions,
  tmListTasks,
} from "@/lib/tmClient";
import type {
  Institution,
  InstitutionType,
  BrandRelevance,
  LeadStage,
  ConversionStatus,
  OfficeTask,
  OfficeUser,
  InstitutionConflictSignal,
  InstitutionDraft,
} from "@/types/taskManager";
import {
  normalizeInstitutionName,
  getErrorMessage,
  ensureInstitutionDraft,
} from "@/utils/taskManager";

export interface UseInstitutionsReturn {
  // Institution list
  institutions: Institution[];
  setInstitutions: React.Dispatch<React.SetStateAction<Institution[]>>;
  reloadInstitutions: () => Promise<void>;
  institutionsLoading: boolean;
  institutionsLoadError: string | null;
  institutionsLoadSource: "supabase" | "cache" | "tasks" | "empty";

  // Task-level institution search
  institutionSearchByTask: Record<string, string>;
  setInstitutionSearchByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  expandedInstitutionSuggestionByTask: Record<string, string | null>;
  setExpandedInstitutionSuggestionByTask: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  showCreateInstitutionForTask: string | null;
  setShowCreateInstitutionForTask: React.Dispatch<React.SetStateAction<string | null>>;
  creatingInstitutionForTask: string | null;
  setCreatingInstitutionForTask: React.Dispatch<React.SetStateAction<string | null>>;
  duplicateConfirmByTask: Record<string, boolean>;
  setDuplicateConfirmByTask: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  institutionCreateDraftByTask: Record<string, InstitutionDraft>;
  setInstitutionCreateDraftByTask: React.Dispatch<React.SetStateAction<Record<string, InstitutionDraft>>>;
  institutionConflictByTask: Record<string, InstitutionConflictSignal | null>;
  setInstitutionConflictByTask: React.Dispatch<React.SetStateAction<Record<string, InstitutionConflictSignal | null>>>;

  // Admin institution filters
  adminInstitutionSearch: string;
  setAdminInstitutionSearch: React.Dispatch<React.SetStateAction<string>>;
  adminInstitutionTypeFilter: InstitutionType | "all";
  setAdminInstitutionTypeFilter: React.Dispatch<React.SetStateAction<InstitutionType | "all">>;
  adminInstitutionCityFilter: string;
  setAdminInstitutionCityFilter: React.Dispatch<React.SetStateAction<string>>;
  adminInstitutionBrandFilter: BrandRelevance | "all";
  setAdminInstitutionBrandFilter: React.Dispatch<React.SetStateAction<BrandRelevance | "all">>;
  adminInstitutionLeadStageFilter: LeadStage | "all";
  setAdminInstitutionLeadStageFilter: React.Dispatch<React.SetStateAction<LeadStage | "all">>;
  adminInstitutionConversionFilter: ConversionStatus | "all";
  setAdminInstitutionConversionFilter: React.Dispatch<React.SetStateAction<ConversionStatus | "all">>;
  adminInstitutionLeadScoreBand: "all" | "high" | "medium" | "low";
  setAdminInstitutionLeadScoreBand: React.Dispatch<React.SetStateAction<"all" | "high" | "medium" | "low">>;
  adminInstitutionSort: "recently_updated" | "last_visited" | "most_visits" | "city" | "name";
  setAdminInstitutionSort: React.Dispatch<React.SetStateAction<"recently_updated" | "last_visited" | "most_visits" | "city" | "name">>;

  // Institution import
  institutionImportBusy: boolean;
  setInstitutionImportBusy: React.Dispatch<React.SetStateAction<boolean>>;
  institutionImportSummary: string | null;
  setInstitutionImportSummary: React.Dispatch<React.SetStateAction<string | null>>;

  // Selected institution
  selectedInstitutionId: string | null;
  setSelectedInstitutionId: React.Dispatch<React.SetStateAction<string | null>>;

  // Functions
  getInstitutionSuggestions: (searchTerm: string) => Institution[];
  fetchInstitutionSuggestions: (searchTerm: string) => Promise<Institution[]>;
  applyInstitutionToTask: (task: OfficeTask, institution: Institution) => Promise<void>;
  createInstitutionForTask: (task: OfficeTask) => Promise<void>;
  checkInstitutionConflict: (
    key: string,
    institutionId?: string | null,
    institutionName?: string | null,
    currentTaskId?: string | null,
  ) => Promise<InstitutionConflictSignal | null>;
  handleInstitutionExcelImport: (file: File) => Promise<void>;
}

export default function useInstitutions(
  officeUser: OfficeUser | null,
  extraDeps: {
    tasks: OfficeTask[];
    refreshTasks: (options?: { showLoading?: boolean }) => Promise<void>;
    logActivityEvent: (payload: {
      eventType: string;
      summary: string;
      visitTaskId?: string | null;
      institutionId?: string | null;
      targetUserId?: string | null;
      metadata?: Record<string, unknown>;
    }) => Promise<void>;
  },
): UseInstitutionsReturn {
  const { tasks, refreshTasks, logActivityEvent } = extraDeps;

  const mapTasksToInstitutionCatalog = useCallback((taskRows: OfficeTask[]) => {
    const map = new Map<string, Institution>();
    for (const task of taskRows) {
      const name = (task.institution_name || "").trim();
      if (!name) continue;
      const city = null;
      const normalizedName = normalizeInstitutionName(name);
      const dedupeKey = `${normalizedName}|${(city || "").toLowerCase()}|${task.institution_type || "School"}`;
      if (map.has(dedupeKey)) continue;
      const nowIso = new Date().toISOString();
      map.set(dedupeKey, {
        id: task.institution_id || `task-${dedupeKey}`,
        name,
        normalized_name: normalizedName,
        institution_type: task.institution_type || "School",
        brand_relevance:
          task.visit_brand === "Vivencia" ? "vivencia" : task.visit_brand === "ONROL" ? "onrol" : "both",
        address_line_1: null,
        address_line_2: null,
        area: null,
        city,
        state: null,
        pincode: null,
        country: "India",
        latitude: null,
        longitude: null,
        google_maps_link: null,
        website: null,
        primary_contact_name: null,
        primary_contact_designation: null,
        primary_contact_phone: null,
        primary_contact_email: null,
        alternate_contact_name: null,
        alternate_contact_designation: null,
        alternate_contact_phone: null,
        alternate_contact_email: null,
        notes_internal: null,
        current_lead_stage: "new_lead",
        last_visit_at: task.updated_at || nowIso,
        last_outcome: task.visit_outcome?.join(", ") || null,
        created_by: task.user_id || null,
        updated_by: task.user_id || null,
        created_at: task.created_at || nowIso,
        updated_at: task.updated_at || nowIso,
        is_active: true,
      });
    }
    return Array.from(map.values());
  }, []);

  // Institution list
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Task-level institution search
  const [institutionSearchByTask, setInstitutionSearchByTask] = useState<Record<string, string>>({});
  const [expandedInstitutionSuggestionByTask, setExpandedInstitutionSuggestionByTask] = useState<Record<string, string | null>>({});
  const [showCreateInstitutionForTask, setShowCreateInstitutionForTask] = useState<string | null>(null);
  const [creatingInstitutionForTask, setCreatingInstitutionForTask] = useState<string | null>(null);
  const [duplicateConfirmByTask, setDuplicateConfirmByTask] = useState<Record<string, boolean>>({});
  const [institutionCreateDraftByTask, setInstitutionCreateDraftByTask] = useState<Record<string, InstitutionDraft>>({});
  const [institutionConflictByTask, setInstitutionConflictByTask] = useState<Record<string, InstitutionConflictSignal | null>>({});

  // Admin institution filters
  const [adminInstitutionSearch, setAdminInstitutionSearch] = useState("");
  const [adminInstitutionTypeFilter, setAdminInstitutionTypeFilter] = useState<InstitutionType | "all">("all");
  const [adminInstitutionCityFilter, setAdminInstitutionCityFilter] = useState("");
  const [adminInstitutionBrandFilter, setAdminInstitutionBrandFilter] = useState<BrandRelevance | "all">("all");
  const [adminInstitutionLeadStageFilter, setAdminInstitutionLeadStageFilter] = useState<LeadStage | "all">("all");
  const [adminInstitutionConversionFilter, setAdminInstitutionConversionFilter] = useState<ConversionStatus | "all">("all");
  const [adminInstitutionLeadScoreBand, setAdminInstitutionLeadScoreBand] = useState<"all" | "high" | "medium" | "low">("all");
  const [adminInstitutionSort, setAdminInstitutionSort] = useState<"recently_updated" | "last_visited" | "most_visits" | "city" | "name">("recently_updated");

  // Institution import
  const [institutionImportBusy, setInstitutionImportBusy] = useState(false);
  const [institutionImportSummary, setInstitutionImportSummary] = useState<string | null>(null);

  // Selected institution
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [cachedInstitutions, setCachedInstitutions] = useState<Institution[]>([]);
  const [seedInstitutions, setSeedInstitutions] = useState<Institution[]>([]);
  const suggestionCacheRef = useRef<Record<string, Institution[]>>({});
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [institutionsLoadError, setInstitutionsLoadError] = useState<string | null>(null);
  const [institutionsLoadSource, setInstitutionsLoadSource] = useState<"supabase" | "cache" | "tasks" | "empty">("empty");
  const institutionsCacheKey = officeUser?.id ? `task-institutions-cache-${officeUser.id}` : null;
  const taskBackfillInstitutions = useMemo<Institution[]>(
    () => mapTasksToInstitutionCatalog(tasks),
    [mapTasksToInstitutionCatalog, tasks],
  );

  // ── Fetch all institutions (paginated, handles 3000+) ───────────────────
  const reloadInstitutions = useCallback(async () => {
    if (!officeUser?.id) {
      setInstitutions([]);
      setInstitutionsLoadSource("empty");
      setInstitutionsLoadError(null);
      setInstitutionsLoading(false);
      return;
    }
    setInstitutionsLoading(true);
    setInstitutionsLoadError(null);
    let crmErrorMessage: string | null = null;
    try {
      const rows = await tmListInstitutions(5000);
      if (rows.length) {
        const list = rows as unknown as Institution[];
        setInstitutions(list);
        setInstitutionsLoadSource("supabase");
        setInstitutionsLoadError(null);
        setInstitutionsLoading(false);
        if (institutionsCacheKey) {
          try {
            localStorage.setItem(institutionsCacheKey, JSON.stringify(list.slice(0, 5000)));
          } catch { /* ignore */ }
        }
        return;
      }
    } catch (error: unknown) {
      crmErrorMessage = getErrorMessage(error, "Unable to load institution catalog.");
    }

    if (cachedInstitutions.length) {
      setInstitutions(cachedInstitutions);
      setInstitutionsLoadSource("cache");
      setInstitutionsLoadError(crmErrorMessage);
      setInstitutionsLoading(false);
      return;
    }

    if (taskBackfillInstitutions.length) {
      setInstitutions(taskBackfillInstitutions);
      setInstitutionsLoadSource("tasks");
      setInstitutionsLoadError(crmErrorMessage);
      setInstitutionsLoading(false);
      return;
    }

    try {
      const taskRows = await tmListTasks({ limit: 3000 });
      const mapped = mapTasksToInstitutionCatalog((taskRows || []) as unknown as OfficeTask[]);
      if (mapped.length) {
        setInstitutions(mapped);
        setInstitutionsLoadSource("tasks");
        setInstitutionsLoadError(crmErrorMessage);
        setInstitutionsLoading(false);
        return;
      }
    } catch {
      // ignore secondary fallback failure
    }

    setInstitutions([]);
    setInstitutionsLoadSource("empty");
    setInstitutionsLoadError(crmErrorMessage);
    setInstitutionsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeUser?.id, taskBackfillInstitutions, cachedInstitutions, institutionsCacheKey]);

  useEffect(() => {
    if (!institutionsCacheKey) return;
    try {
      const raw = localStorage.getItem(institutionsCacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Institution[];
      if (Array.isArray(parsed) && parsed.length) {
        setCachedInstitutions(parsed);
      }
    } catch {
      // ignore broken cache payload
    }
  }, [institutionsCacheKey]);

  useEffect(() => {
    if (!officeUser?.id) return;
    void reloadInstitutions();
  }, [officeUser?.id, reloadInstitutions]);

  // Get institution suggestions by search term
  const getInstitutionSuggestions = useCallback(
    (searchTerm: string) => {
      const q = searchTerm.trim().toLowerCase();
      if (q.length < 2) return [];
      const source = institutions.length
        ? institutions
        : cachedInstitutions.length
          ? cachedInstitutions
          : taskBackfillInstitutions.length
            ? taskBackfillInstitutions
            : seedInstitutions;
      return source
        .filter((inst) => {
          return (
            inst.name.toLowerCase().includes(q) ||
            (inst.city || "").toLowerCase().includes(q) ||
            (inst.area || "").toLowerCase().includes(q) ||
            (inst.primary_contact_name || "").toLowerCase().includes(q)
          );
        })
        .slice(0, 8);
    },
    [institutions, taskBackfillInstitutions, cachedInstitutions, seedInstitutions],
  );

  const loadSeedInstitutions = useCallback(async (): Promise<Institution[]> => {
    if (seedInstitutions.length) return seedInstitutions;
    try {
      const mod = await import("../../../supabase/school_list_hyd_replace.sql?raw");
      const sql = (mod.default || "") as string;
      if (!sql) return [];
      const nowIso = new Date().toISOString();
      const rows: Institution[] = [];
      const regex =
        /\('((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'\),?/g;
      let match: RegExpExecArray | null = null;
      while ((match = regex.exec(sql)) && rows.length < 3500) {
        const name = match[1].replace(/''/g, "'").trim();
        const normalizedName = match[2].replace(/''/g, "'").trim() || normalizeInstitutionName(name);
        const address = match[3].replace(/''/g, "'").trim() || null;
        const city = match[4].replace(/''/g, "'").trim() || null;
        const state = match[5].replace(/''/g, "'").trim() || null;
        const phoneRaw = match[6].replace(/''/g, "'").trim();
        const phone = phoneRaw && phoneRaw.toLowerCase() !== "nan" ? phoneRaw : null;
        if (!name) continue;
        rows.push({
          id: `seed-${normalizedName}-${rows.length}`,
          name,
          normalized_name: normalizedName,
          institution_type: "School",
          brand_relevance: "both",
          address_line_1: address,
          address_line_2: null,
          area: null,
          city,
          state,
          pincode: null,
          country: "India",
          latitude: null,
          longitude: null,
          google_maps_link: null,
          website: null,
          primary_contact_name: null,
          primary_contact_designation: null,
          primary_contact_phone: phone,
          primary_contact_email: null,
          alternate_contact_name: null,
          alternate_contact_designation: null,
          alternate_contact_phone: null,
          alternate_contact_email: null,
          notes_internal: null,
          current_lead_stage: "new_lead",
          last_visit_at: null,
          last_outcome: null,
          created_by: null,
          updated_by: null,
          created_at: nowIso,
          updated_at: nowIso,
          is_active: true,
        });
      }
      if (rows.length) {
        setSeedInstitutions(rows);
        setInstitutions((prev) => (prev.length ? prev : rows));
        setInstitutionsLoadSource("tasks");
      }
      return rows;
    } catch {
      return [];
    }
  }, [seedInstitutions]);

  // Remote suggestion fetch for typeahead when preloaded catalog is empty/stale
  const fetchInstitutionSuggestions = useCallback(
    async (searchTerm: string) => {
      const q = searchTerm.trim();
      if (!officeUser?.id || q.length < 2) return [];
      const cacheKey = q.toLowerCase();
      const cached = suggestionCacheRef.current[cacheKey];
      if (cached?.length) return cached;
      const qLower = q.toLowerCase();
      try {
        // Client-side filter against the already-loaded catalog. The CRM
        // doesn't expose a server-side ilike search yet; the in-memory list
        // is capped at 5000 rows, which covers the typical org.
        const rows = institutions
          .filter((inst) =>
            inst.name.toLowerCase().includes(qLower) ||
            (inst.city || "").toLowerCase().includes(qLower) ||
            (inst.area || "").toLowerCase().includes(qLower) ||
            (inst.primary_contact_name || "").toLowerCase().includes(qLower),
          )
          .slice(0, 12);
        if (rows.length) {
          setInstitutionsLoadSource("supabase");
          setInstitutionsLoadError(null);
        }

        if (!rows.length) {
          const taskRows = await tmListTasks({ limit: 200 }).catch(() => [] as Array<Record<string, unknown>>);
          const filteredTasks = (taskRows as unknown as OfficeTask[])
            .filter((t) => (t.institution_name || "").toLowerCase().includes(qLower))
            .slice(0, 12);
          if (filteredTasks.length) {
            const mapped = mapTasksToInstitutionCatalog(filteredTasks);
            if (mapped.length) {
              setInstitutions((prev) => {
                const byId = new Map<string, Institution>();
                for (const item of prev) byId.set(item.id, item);
                for (const item of mapped) byId.set(item.id, item);
                return Array.from(byId.values());
              });
              setInstitutionsLoadSource("tasks");
              const fast = mapped.slice(0, 8);
              suggestionCacheRef.current[cacheKey] = fast;
              return fast;
            }
          }
        }
        if (!rows.length) {
          const seedRows = await loadSeedInstitutions();
          if (seedRows.length) {
            const qLower = q.toLowerCase();
            const seedMatches = seedRows
              .filter((inst) =>
                inst.name.toLowerCase().includes(qLower) ||
                (inst.city || "").toLowerCase().includes(qLower) ||
                (inst.area || "").toLowerCase().includes(qLower),
              )
              .slice(0, 8);
            suggestionCacheRef.current[cacheKey] = seedMatches;
            return seedMatches;
          }
        }
        suggestionCacheRef.current[cacheKey] = rows;
        return rows;
      } catch (error: unknown) {
        setInstitutionsLoadError(getErrorMessage(error, "Unable to search institutions from Supabase."));
        return [];
      }
    },
    [loadSeedInstitutions, mapTasksToInstitutionCatalog, officeUser?.id],
  );

  // Find local institution conflict
  const findLocalInstitutionConflict = useCallback(
    (
      institutionId?: string | null,
      institutionName?: string | null,
      currentTaskId?: string | null,
    ): InstitutionConflictSignal | null => {
      if (!officeUser) return null;
      const normalized = normalizeInstitutionName(institutionName || "");
      const conflictingTask = tasks
        .filter((task) => task.task_category === "visit")
        .filter((task) => task.id !== currentTaskId)
        .filter((task) => task.user_id !== officeUser.id)
        .filter(
          (task) =>
            (institutionId && task.institution_id === institutionId) ||
            (!institutionId && normalized && normalizeInstitutionName(task.institution_name || "") === normalized),
        )
        .filter((task) => (task.visit_status || "planned") !== "closed_lost")
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
      if (!conflictingTask) return null;
      // Note: teamMembers not available here; caller may need to enrich
      return {
        userId: conflictingTask.user_id,
        fullName: "Another employee",
        visitStatus: conflictingTask.visit_status || null,
        updatedAt: conflictingTask.updated_at || null,
      };
    },
    [officeUser, tasks],
  );

  // Load institution conflict from DB
  const loadInstitutionConflict = useCallback(
    async (
      key: string,
      institutionId?: string | null,
      institutionName?: string | null,
      currentTaskId?: string | null,
    ) => {
      const local = findLocalInstitutionConflict(institutionId, institutionName, currentTaskId);
      if (local) {
        setInstitutionConflictByTask((prev) => ({ ...prev, [key]: local }));
        return local;
      }

      try {
        if (!institutionId) {
          setInstitutionConflictByTask((prev) => ({ ...prev, [key]: null }));
          return null;
        }
        const rows = await tmListInstitutionHandlers([institutionId]);
        // Pick first handler that isn't the current user (a "conflict").
        const row = rows.find((r) => String(r.assigned_to ?? "") !== (officeUser?.id ?? "")) as
          | { assigned_to: string; full_name: string | null; last_active_at: string | null }
          | undefined;
        const signal: InstitutionConflictSignal | null = row
          ? {
              userId: row.assigned_to,
              fullName: row.full_name || "Someone",
              visitStatus: null,
              updatedAt: row.last_active_at,
            }
          : null;
        setInstitutionConflictByTask((prev) => ({ ...prev, [key]: signal }));
        return signal;
      } catch {
        setInstitutionConflictByTask((prev) => ({ ...prev, [key]: null }));
        return null;
      }
    },
    [findLocalInstitutionConflict, officeUser],
  );

  // Check institution conflict (public wrapper)
  const checkInstitutionConflict = useCallback(
    async (
      key: string,
      institutionId?: string | null,
      institutionName?: string | null,
      currentTaskId?: string | null,
    ) => {
      return loadInstitutionConflict(key, institutionId, institutionName, currentTaskId);
    },
    [loadInstitutionConflict],
  );

  // Apply institution to task
  const applyInstitutionToTask = useCallback(
    async (task: OfficeTask, institution: Institution) => {
      const conflict = await loadInstitutionConflict(task.id, institution.id, institution.name, task.id);
      if (conflict) {
        toast.message(
          `Caution: ${conflict.fullName} is already handling this institution.`,
        );
      }
      const updates: Partial<OfficeTask> = {
        institution_id: institution.id,
        institution_name: institution.name,
        institution_type: institution.institution_type,
        visit_brand:
          task.visit_brand ||
          (institution.brand_relevance === "vivencia" ? "Vivencia" : institution.brand_relevance === "onrol" ? "ONROL" : null),
      };
      try {
        await tmUpdateTask(task.id, updates as Record<string, unknown>);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to link institution."));
        return;
      }
      await logActivityEvent({
        eventType: "institution_linked",
        summary: `${task.task_title}: linked to ${institution.name}`,
        visitTaskId: task.id,
        institutionId: institution.id,
      });
      setInstitutionSearchByTask((prev) => ({ ...prev, [task.id]: institution.name }));
      await refreshTasks();
    },
    [loadInstitutionConflict, logActivityEvent, refreshTasks],
  );

  // Create institution for task
  const createInstitutionForTask = useCallback(
    async (task: OfficeTask) => {
      const draft = institutionCreateDraftByTask[task.id];
      if (!draft?.name?.trim() || !draft?.city?.trim()) {
        toast.error("Institution name and city are required.");
        return;
      }

      const normalized = normalizeInstitutionName(draft.name);
      const duplicates = institutions.filter(
        (inst) =>
          inst.normalized_name === normalized &&
          inst.institution_type === draft.institutionType &&
          (inst.city || "").toLowerCase() === draft.city.trim().toLowerCase(),
      );

      if (duplicates.length) {
        if (!duplicateConfirmByTask[task.id]) {
          setDuplicateConfirmByTask((prev) => ({ ...prev, [task.id]: true }));
          toast.message("Possible duplicate found. Click create again to continue anyway.");
          return;
        }
      }

      setCreatingInstitutionForTask(task.id);
      const payload = {
        name: draft.name.trim(),
        normalized_name: normalized,
        institution_type: draft.institutionType,
        brand_relevance: draft.brandRelevance,
        city: draft.city.trim(),
        area: draft.area.trim() || null,
        address_line_1: draft.address.trim() || null,
        primary_contact_name: draft.contactName.trim() || null,
        primary_contact_phone: draft.contactPhone.trim() || null,
        country: "India",
        current_lead_stage: "new_lead" as LeadStage,
        is_active: true,
        created_by: officeUser?.id || null,
        updated_by: officeUser?.id || null,
      };

      let created: Institution | null = null;
      try {
        const row = await tmCreateInstitution(payload as Record<string, unknown>);
        created = row as unknown as Institution;
      } catch (error: unknown) {
        setCreatingInstitutionForTask(null);
        toast.error(getErrorMessage(error, "Unable to create institution."));
        return;
      }

      await applyInstitutionToTask(task, created);
      await logActivityEvent({
        eventType: "institution_created",
        summary: `Institution created: ${payload.name}`,
        visitTaskId: task.id,
        institutionId: created.id,
        metadata: { institution_type: payload.institution_type, city: payload.city, brand_relevance: payload.brand_relevance },
      });
      setShowCreateInstitutionForTask(null);
      setInstitutionConflictByTask((prev) => ({ ...prev, [task.id]: null }));
      setDuplicateConfirmByTask((prev) => ({ ...prev, [task.id]: false }));
      setCreatingInstitutionForTask(null);
      toast.success("Institution created and linked.");
    },
    [institutionCreateDraftByTask, institutions, duplicateConfirmByTask, officeUser, applyInstitutionToTask, logActivityEvent],
  );

  // Handle institution Excel import
  const handleInstitutionExcelImport = useCallback(
    async (file: File) => {
      if (!officeUser || officeUser.role !== "admin") return;
      setInstitutionImportBusy(true);
      setInstitutionImportSummary(null);
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error("No worksheet found.");
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        if (!rows.length) throw new Error("No rows found in file.");

        const existingMap = new Map(
          institutions.map((inst) => [
            `${normalizeInstitutionName(inst.name)}|${(inst.city || "").trim().toLowerCase()}|${inst.institution_type}`,
            inst,
          ]),
        );

        const inserts: Array<Record<string, unknown>> = [];
        const updates: Array<Record<string, unknown>> = [];

        const readCell = (row: Record<string, unknown>, keys: string[]) => {
          const key = Object.keys(row).find((k) => keys.includes(k.trim().toLowerCase()));
          return key ? String(row[key] ?? "").trim() : "";
        };

        for (const row of rows) {
          const name =
            readCell(row, ["institution_name", "institution", "name", "school_name", "college_name"]) || "";
          if (!name) continue;
          const typeRaw = readCell(row, ["institution_type", "type"]);
          const institutionType: InstitutionType = typeRaw.toLowerCase().includes("college") ? "College" : "School";
          const city = readCell(row, ["city"]);
          const normalizedName = normalizeInstitutionName(name);
          const key = `${normalizedName}|${city.toLowerCase()}|${institutionType}`;
          const brandRaw = readCell(row, ["brand_relevance", "brand"]);
          const brandRelevance: BrandRelevance =
            brandRaw.toLowerCase().includes("vivencia")
              ? "vivencia"
              : brandRaw.toLowerCase().includes("onrol")
                ? "onrol"
                : "both";

          const payload: Record<string, unknown> = {
            name,
            normalized_name: normalizedName,
            institution_type: institutionType,
            brand_relevance: brandRelevance,
            city: city || null,
            area: readCell(row, ["area", "locality"]) || null,
            address_line_1: readCell(row, ["address", "address_line_1"]) || null,
            google_maps_link: readCell(row, ["google_maps_link", "maps_link", "maps_url"]) || null,
            website: readCell(row, ["website", "site"]) || null,
            primary_contact_name: readCell(row, ["primary_contact_name", "contact_name"]) || null,
            primary_contact_phone: readCell(row, ["primary_contact_phone", "contact_phone", "phone"]) || null,
            primary_contact_email: readCell(row, ["primary_contact_email", "contact_email", "email"]) || null,
            updated_by: officeUser.id,
            is_active: true,
          };

          const existing = existingMap.get(key);
          if (existing) {
            updates.push({ id: existing.id, ...payload });
          } else {
            inserts.push({ ...payload, created_by: officeUser.id });
          }
        }

        let inserted = 0;
        let updated = 0;
        if (inserts.length) {
          const out = await tmBulkUpsertInstitutions(inserts);
          inserted = typeof out === "number" ? out : inserts.length;
        }
        if (updates.length) {
          const out = await tmBulkUpsertInstitutions(updates);
          updated = typeof out === "number" ? out : updates.length;
        }

        setInstitutionImportSummary(`Imported successfully: ${inserted} new, ${updated} updated.`);
        await refreshTasks();
        toast.success("Institution list imported.");
      } catch (error: unknown) {
        const message = getErrorMessage(error, "Institution import failed.");
        setInstitutionImportSummary(message);
        toast.error(message);
      } finally {
        setInstitutionImportBusy(false);
      }
    },
    [officeUser, institutions, refreshTasks],
  );

  return {
    // Institution list
    institutions,
    setInstitutions,
    reloadInstitutions,
    institutionsLoading,
    institutionsLoadError,
    institutionsLoadSource,

    // Task-level institution search
    institutionSearchByTask,
    setInstitutionSearchByTask,
    expandedInstitutionSuggestionByTask,
    setExpandedInstitutionSuggestionByTask,
    showCreateInstitutionForTask,
    setShowCreateInstitutionForTask,
    creatingInstitutionForTask,
    setCreatingInstitutionForTask,
    duplicateConfirmByTask,
    setDuplicateConfirmByTask,
    institutionCreateDraftByTask,
    setInstitutionCreateDraftByTask,
    institutionConflictByTask,
    setInstitutionConflictByTask,

    // Admin institution filters
    adminInstitutionSearch,
    setAdminInstitutionSearch,
    adminInstitutionTypeFilter,
    setAdminInstitutionTypeFilter,
    adminInstitutionCityFilter,
    setAdminInstitutionCityFilter,
    adminInstitutionBrandFilter,
    setAdminInstitutionBrandFilter,
    adminInstitutionLeadStageFilter,
    setAdminInstitutionLeadStageFilter,
    adminInstitutionConversionFilter,
    setAdminInstitutionConversionFilter,
    adminInstitutionLeadScoreBand,
    setAdminInstitutionLeadScoreBand,
    adminInstitutionSort,
    setAdminInstitutionSort,

    // Institution import
    institutionImportBusy,
    setInstitutionImportBusy,
    institutionImportSummary,
    setInstitutionImportSummary,

    // Selected institution
    selectedInstitutionId,
    setSelectedInstitutionId,

    // Functions
    getInstitutionSuggestions,
    fetchInstitutionSuggestions,
    applyInstitutionToTask,
    createInstitutionForTask,
    checkInstitutionConflict,
    handleInstitutionExcelImport,
  };
}
