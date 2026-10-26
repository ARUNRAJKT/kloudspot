import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TodayButton } from "@/components/AppShell";
import { Skeleton } from "@/components/Skeleton";
import { useSite } from "@/context/SiteContext";
import { fetchEntries } from "@/lib/analytics";
import { siteCalendarDate } from "@/lib/time";

const PAGE_SIZE = 10;

function formatClock(localValue) {
  if (!localValue) return "--";
  const match = String(localValue).match(/(\d{1,2}):(\d{2})/);
  if (!match) return "--";
  const hour24 = Number(match[1]);
  const hour = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${hour}:${match[2]} ${suffix}`;
}

function formatStay(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return "--";
  const total = Math.max(0, Math.round(Number(minutes)));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatGender(value, t) {
  if (!value) return "--";
  const key = String(value).toLowerCase();
  return t(`gender.${key}`, { defaultValue: value });
}

function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function pageItems(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 3) return [1, 2, 3, "gap", total];
  if (current >= total - 2) return [1, "gap", total - 2, total - 1, total];
  return [1, "gap", current - 1, current, current + 1, "gap", total];
}

export default function EntriesPage() {
  const { t } = useTranslation();
  const { site, sitesError, selectedDate } = useSite();
  const [page, setPage] = useState(1);
  const [trackedScope, setTrackedScope] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const todayKey = site ? siteCalendarDate(site.timezone) : "";
  const dateKey =
    selectedDate && (!todayKey || selectedDate <= todayKey)
      ? selectedDate
      : todayKey;
  const viewingToday = Boolean(dateKey) && dateKey === todayKey;
  const scopeKey = site ? `${site.siteId}:${dateKey}` : "";

  if (scopeKey && scopeKey !== trackedScope) {
    setTrackedScope(scopeKey);
    setPage(1);
    setResult(null);
    setError("");
  }

  const requestKey = scopeKey ? `${scopeKey}:${page}` : "";
  if (requestKey && requestKey !== loadedKey) {
    setLoadedKey(requestKey);
    setResult(null);
    setError("");
  }

  useEffect(() => {
    if (!site || !dateKey) return undefined;
    let active = true;
    fetchEntries(site, page, PAGE_SIZE, viewingToday ? "" : dateKey)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setError("errors.entries");
      });
    return () => {
      active = false;
    };
  }, [site, page, dateKey, viewingToday]);

  const loading =
    (!site && !sitesError) || (Boolean(site) && !result && !error);
  const totalPages = result?.totalPages || 1;
  const records = result?.records || [];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
          {t("nav.entries")}
        </h1>
        <TodayButton />
      </div>

      {sitesError ? (
        <p className="mb-3 text-sm text-red-600">{t(sitesError)}</p>
      ) : null}
      {error ? <p className="mb-3 text-sm text-red-600">{t(error)}</p> : null}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("entries.name")}</th>
                <th className="px-4 py-3 font-medium">{t("entries.sex")}</th>
                <th className="px-4 py-3 font-medium">{t("entries.entry")}</th>
                <th className="px-4 py-3 font-medium">{t("entries.exit")}</th>
                <th className="px-4 py-3 font-medium">{t("entries.dwell")}</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: PAGE_SIZE }, (_, index) => (
                    <tr key={index} className="border-t border-neutral-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-12" />
                      </td>
                    </tr>
                  ))
                : null}
              {!loading && records.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-neutral-500" colSpan={5}>
                    {viewingToday ? t("entries.empty") : t("entries.emptyDay")}
                  </td>
                </tr>
              ) : null}
              {records.map((record) => (
                <tr
                  key={`${record.personId}-${record.entryUtc}`}
                  className="border-t border-neutral-100"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600">
                        {initials(record.personName)}
                      </span>
                      <span className="font-medium text-neutral-800">
                        {record.personName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatGender(record.gender, t)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {formatClock(record.entryLocal)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {formatClock(record.exitLocal)}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {formatStay(record.dwellMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result ? (
        <div className="flex items-center justify-center gap-1 py-4">
          <button
            type="button"
            className="rounded-md p-1.5 text-neutral-500 disabled:opacity-40"
            aria-label={t("entries.previous")}
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          {pageItems(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-neutral-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`min-w-8 rounded-md px-2 py-1 text-sm ${
                  item === page
                    ? "font-semibold text-teal-600 underline decoration-2 underline-offset-4"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className="rounded-md p-1.5 text-neutral-500 disabled:opacity-40"
            aria-label={t("entries.next")}
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
