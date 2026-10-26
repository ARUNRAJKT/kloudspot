import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, MapPin, X } from "lucide-react";
import { useSite } from "@/context/SiteContext";

function alertDate(value) {
  const time = Number(value);
  if (!Number.isFinite(time)) return null;
  return new Date(time < 1e12 ? time * 1000 : time);
}

function formatWhen(value, timeZone, language) {
  const date = alertDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat(language, {
    timeZone: timeZone || "UTC",
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return `${part("month")} ${part("day")} ${part("year")}, ${part("hour")}:${part("minute")}`;
}

function actionKey(direction) {
  const value = String(direction || "").toLowerCase();
  if (value === "exit" || value === "exited") return "alerts.exited";
  return "alerts.entered";
}

function severityKey(severity) {
  const value = String(severity || "").toLowerCase();
  if (value === "high" || value === "medium" || value === "low") return value;
  return "";
}

const severityClass = {
  high: "bg-red-500 text-white",
  medium: "bg-orange-500 text-white",
  low: "bg-green-600 text-white",
};

export default function AlertsPanel() {
  const { t, i18n } = useTranslation();
  const { alerts, site } = useSite();
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState(0);

  const visible = alerts.filter(
    (alert) => !site?.siteId || alert.siteId === site.siteId,
  );
  const unread = visible.some((alert) => {
    const date = alertDate(alert.ts);
    return date && date.getTime() > seenAt;
  });

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function openPanel() {
    setSeenAt(Date.now());
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className="relative rounded-md p-1 text-neutral-500 hover:text-neutral-800"
        aria-label={t("alerts.open")}
        aria-expanded={open}
        onClick={openPanel}
      >
        <Bell className="size-5" />
        {unread ? (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-red-500" />
        ) : null}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label={t("alerts.close")}
            onClick={() => setOpen(false)}
          />
          <aside className="absolute top-0 right-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <h2 className="text-base font-semibold">{t("alerts.title")}</h2>
              <button
                type="button"
                className="rounded-md p-1 text-neutral-500 hover:text-neutral-800"
                aria-label={t("alerts.close")}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-auto bg-neutral-50 p-3">
              {visible.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-neutral-500">
                  {t("alerts.empty")}
                </p>
              ) : (
                visible.map((alert, index) => {
                  const level = severityKey(alert.severity);
                  return (
                    <article
                      key={alert.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${
                        index === 0
                          ? "border-[#8fd0c9] bg-[#e7f7f5]"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs text-neutral-500">
                          {formatWhen(alert.ts, site?.timezone, i18n.language)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {alert.personName} {t(actionKey(alert.direction))}
                        </p>
                        <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-neutral-500">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{alert.zoneName}</span>
                        </p>
                      </div>
                      {level ? (
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${severityClass[level]}`}
                        >
                          {t(`alerts.${level}`)}
                        </span>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
