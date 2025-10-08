// src/utils/localDates.js
import { parse, format } from "date-fns";

const MS_DAY = 24 * 60 * 60 * 1000;

export const pickYmd = (s) =>
  typeof s === "string" ? s.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null : null;

/** Parse as a LOCAL calendar date (no UTC shift). Accepts 'yyyy-MM-dd' or ISO strings. */
export const toLocalDate = (input) => {
  if (!input) return null;
  if (typeof input === "string") {
    const ymd = pickYmd(input);
    if (ymd) return parse(ymd, "yyyy-MM-dd", new Date());
  }
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Return a 'yyyy-MM-dd' for inputs (string or Date), in local time. */
export const toYmdLocal = (input) => {
  const d = toLocalDate(input);
  return d ? format(d, "yyyy-MM-dd") : "";
};

/** Format a local date with a pattern (default: 'MMM d, yyyy'). */
export const formatLocal = (input, pattern = "MMM d, yyyy", fallback = "Not set") => {
  const d = toLocalDate(input);
  return d ? format(d, pattern) : fallback;
};

/** Strict MM/DD/YYYY for UI. */
export const formatMMDDYYYYLocal = (input, fallback = "Not set") => {
  const d = toLocalDate(input);
  if (!d) return fallback;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

/** Add N days to a *local* date (returns a Date). */
export const addDays = (input, days) => {
  const d = toLocalDate(input);
  if (!d) return null;
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** Nights between start and end (end - start), or null if invalid. */
export const nightsBetween = (startYmd, endYmd) => {
  const s = toLocalDate(startYmd);
  const e = toLocalDate(endYmd);
  if (!s || !e) return null;
  const diff = Math.round((e - s) / MS_DAY);
  return diff >= 0 ? diff : null;
};

/** Short range like 'Oct 3–6' or 'Oct 30 – Nov 2' (local). */
export const fmtRangeShort = (start, end) => {
  const s = toLocalDate(start);
  const e = toLocalDate(end);
  if (!s && !e) return "";
  const short = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (s && !e) return short(s);
  if (!s && e) return short(e);

  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();

  if (sameMonth) {
    const mo = s.toLocaleString(undefined, { month: "short" });
    return `${mo} ${s.getDate()}–${e.getDate()}`;
  }
  const startFmt = s.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const endFmt = e.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  return `${startFmt} – ${endFmt}`;
};

/** True if trip is ongoing or upcoming (treat end as inclusive). */
export const isOngoingOrUpcoming = (start, end, now = new Date()) => {
  const s = toLocalDate(start);
  const eInc = addDays(end, 1); // inclusive end
  if (!s || !eInc) return false;
  return eInc >= now;
};
