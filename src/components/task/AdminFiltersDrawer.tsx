import React from "react";
import { X, RotateCcw, SlidersHorizontal } from "lucide-react";
import { OfficeUser } from "@/types/taskManager";

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminFiltersDrawerProps {
  open: boolean;
  onClose: () => void;

  adminRangePreset: string;
  setAdminRangePreset: (v: string) => void;
  adminRangeFrom: string;
  setAdminRangeFrom: (v: string) => void;
  adminRangeTo: string;
  setAdminRangeTo: (v: string) => void;

  adminGlobalBrand: string;
  setAdminGlobalBrand: (v: string) => void;
  adminGlobalInstitutionType: string;
  setAdminGlobalInstitutionType: (v: string) => void;
  adminGlobalEmployee: string;
  setAdminGlobalEmployee: (v: string) => void;
  adminGlobalCity: string;
  setAdminGlobalCity: (v: string) => void;
  adminGlobalVisitStatus: string;
  setAdminGlobalVisitStatus: (v: string) => void;
  adminGlobalLeadStage: string;
  setAdminGlobalLeadStage: (v: string) => void;
  adminGlobalConversionStatus: string;
  setAdminGlobalConversionStatus: (v: string) => void;

  teamMembers: OfficeUser[];
  onReset: () => void;
  onApply: () => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
      {children}
    </p>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value === value ? "" : opt.value)}
          className={[
            "text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
            value === opt.value
              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Active filter count ───────────────────────────────────────────────────────

function countActiveFilters(props: AdminFiltersDrawerProps): number {
  let count = 0;
  if (props.adminRangePreset)            count++;
  if (props.adminRangeFrom)              count++;
  if (props.adminRangeTo)                count++;
  if (props.adminGlobalBrand)            count++;
  if (props.adminGlobalInstitutionType)  count++;
  if (props.adminGlobalEmployee)         count++;
  if (props.adminGlobalCity)             count++;
  if (props.adminGlobalVisitStatus)      count++;
  if (props.adminGlobalLeadStage)        count++;
  if (props.adminGlobalConversionStatus) count++;
  return count;
}

// ── Date range presets ────────────────────────────────────────────────────────

const RANGE_PRESETS = [
  { label: "Today",      value: "today" },
  { label: "This Week",  value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "Custom",     value: "custom" },
];

// ── Lead stage options ────────────────────────────────────────────────────────

const LEAD_STAGES = [
  { label: "New Lead",       value: "new_lead" },
  { label: "Contacted",      value: "contacted" },
  { label: "Visited",        value: "visited" },
  { label: "Interested",     value: "interested" },
  { label: "Follow-up",      value: "followup_pending" },
  { label: "Proposal Exp.",  value: "proposal_expected" },
  { label: "Proposal Sent",  value: "proposal_sent" },
  { label: "Demo Sched.",    value: "demo_scheduled" },
  { label: "Negotiation",    value: "negotiation" },
  { label: "Won",            value: "closed_won" },
  { label: "Lost",           value: "closed_lost" },
];

// ── Visit status options ──────────────────────────────────────────────────────

const VISIT_STATUSES = [
  { label: "Planned",    value: "planned" },
  { label: "Completed",  value: "completed" },
  { label: "Rescheduled",value: "rescheduled" },
  { label: "Closed Lost",value: "closed_lost" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminFiltersDrawer(props: AdminFiltersDrawerProps) {
  const {
    open, onClose,
    adminRangePreset, setAdminRangePreset,
    adminRangeFrom, setAdminRangeFrom,
    adminRangeTo, setAdminRangeTo,
    adminGlobalBrand, setAdminGlobalBrand,
    adminGlobalInstitutionType, setAdminGlobalInstitutionType,
    adminGlobalEmployee, setAdminGlobalEmployee,
    adminGlobalCity, setAdminGlobalCity,
    adminGlobalVisitStatus, setAdminGlobalVisitStatus,
    adminGlobalLeadStage, setAdminGlobalLeadStage,
    adminGlobalConversionStatus, setAdminGlobalConversionStatus,
    teamMembers, onReset, onApply,
  } = props;

  const activeCount = countActiveFilters(props);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={[
          "fixed right-0 top-0 h-full w-[min(380px,95vw)] bg-white shadow-2xl z-[201] flex flex-col",
          "transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-900">Filters</span>
            {activeCount > 0 && (
              <span className="text-[11px] font-bold text-white bg-emerald-500 rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                {activeCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-label="Close filters"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable filter body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">

          {/* 1. Date Range */}
          <div>
            <FilterLabel>Date Range</FilterLabel>
            <ChipGroup
              options={RANGE_PRESETS}
              value={adminRangePreset}
              onChange={setAdminRangePreset}
            />
            {adminRangePreset === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">From</p>
                  <input
                    type="date"
                    value={adminRangeFrom}
                    onChange={(e) => setAdminRangeFrom(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 mb-1">To</p>
                  <input
                    type="date"
                    value={adminRangeTo}
                    onChange={(e) => setAdminRangeTo(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Employee */}
          <div>
            <FilterLabel>Employee</FilterLabel>
            <select
              value={adminGlobalEmployee}
              onChange={(e) => setAdminGlobalEmployee(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            >
              <option value="">All Employees</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Brand */}
          <div>
            <FilterLabel>Brand</FilterLabel>
            <ChipGroup
              options={[
                { label: "All",      value: "" },
                { label: "ONROL",    value: "ONROL" },
                { label: "Vivencia", value: "Vivencia" },
              ]}
              value={adminGlobalBrand}
              onChange={(v) => setAdminGlobalBrand(v === adminGlobalBrand ? "" : v)}
            />
          </div>

          {/* 4. Institution Type */}
          <div>
            <FilterLabel>Institution Type</FilterLabel>
            <ChipGroup
              options={[
                { label: "All",     value: "" },
                { label: "College", value: "College" },
                { label: "School",  value: "School" },
              ]}
              value={adminGlobalInstitutionType}
              onChange={(v) =>
                setAdminGlobalInstitutionType(v === adminGlobalInstitutionType ? "" : v)
              }
            />
          </div>

          {/* 5. City */}
          <div>
            <FilterLabel>City</FilterLabel>
            <input
              type="text"
              placeholder="e.g. Hyderabad"
              value={adminGlobalCity}
              onChange={(e) => setAdminGlobalCity(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>

          {/* 6. Visit Status */}
          <div>
            <FilterLabel>Visit Status</FilterLabel>
            <ChipGroup
              options={VISIT_STATUSES}
              value={adminGlobalVisitStatus}
              onChange={(v) =>
                setAdminGlobalVisitStatus(v === adminGlobalVisitStatus ? "" : v)
              }
            />
          </div>

          {/* 7. Lead Stage */}
          <div>
            <FilterLabel>Lead Stage</FilterLabel>
            <ChipGroup
              options={LEAD_STAGES}
              value={adminGlobalLeadStage}
              onChange={(v) =>
                setAdminGlobalLeadStage(v === adminGlobalLeadStage ? "" : v)
              }
            />
          </div>

          {/* 8. Conversion Status */}
          <div>
            <FilterLabel>Conversion Status</FilterLabel>
            <select
              value={adminGlobalConversionStatus}
              onChange={(e) => setAdminGlobalConversionStatus(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="not_converted">Not Converted</option>
              <option value="converted">Converted</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-100 p-3 flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={12} />
            Reset All
          </button>
          <button
            onClick={onApply}
            className="flex-1 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl py-2.5 transition-colors shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
