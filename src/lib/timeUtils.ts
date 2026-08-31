import { formatDistanceToNow, format, isThisYear, isValid, parseISO } from "date-fns";

export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "";

  let date: Date;
  try {
    date = parseISO(dateStr);
    if (!isValid(date)) return "";
  } catch {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  if (diffMs >= 0 && diffMs < sevenDaysMs) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return formatShortDate(dateStr);
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";

  let date: Date;
  try {
    date = parseISO(dateStr);
    if (!isValid(date)) return "";
  } catch {
    return "";
  }

  if (isThisYear(date)) {
    return format(date, "d MMM");
  }
  return format(date, "d MMM yyyy");
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return "< 1m";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}
