import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import decreaseIcon from "@/assets/overview/decrease.svg";
import increaseIcon from "@/assets/overview/increase.svg";
import { TodayButton } from "@/components/AppShell";
import {
  DemographicsCharts,
  OccupancyChart,
} from "@/components/OverviewCharts";
import { Skeleton } from "@/components/Skeleton";
import { useSite } from "@/context/SiteContext";
import {
  compareToPrevious,
  demographicPoints,
  formatCount,
  formatDwell,
  occupancyPoints,
  overviewRequests,
  previousOccupancyAverage,
} from "@/lib/analytics";
import { siteCalendarDate } from "@/lib/time";

function Comparison({ change }) {
  const { t } = useTranslation();
  if (!change) return null;
  if (change.direction === "same") {
    return <p className="text-xs text-neutral-500">{t("metrics.same")}</p>;
  }

  const more = change.direction === "more";

  return (
    <p className="flex items-center gap-1 text-xs text-neutral-900">
      <img
        src={more ? increaseIcon : decreaseIcon}
        alt=""
        className="h-4 w-[18px]"
      />
      {t(more ? "metrics.more" : "metrics.less", { percent: change.percent })}
    </p>
  );
}

function MetricCard({
  label,
  value,
  change,
  valueLoading,
  changeLoading,
  className = "",
}) {
  return (
    <article className={`bg-white px-5 py-4 ${className}`}>
      <p className="text-sm text-neutral-500">{label}</p>
      {valueLoading ? (
        <Skeleton className="mt-3 h-9 w-28" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </p>
      )}
      {changeLoading ? (
        <Skeleton className="mt-4 h-3 w-36" />
      ) : (
        <div className="mt-3">
          <Comparison change={change} />
        </div>
      )}
    </article>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-4 h-64 w-full" />
    </div>
  );
}

const blankMetrics = {
  footfall: null,
  previousFootfall: null,
  dwellMinutes: null,
  previousDwellMinutes: null,
  previousOccupancyAvg: null,
  occupancy: null,
  demographics: null,
  failed: {},
};

export default function OverviewPage() {
  const { t } = useTranslation();
  const { site, liveOccupancy, liveGender, sitesError, selectedDate } =
    useSite();
  const [metrics, setMetrics] = useState(blankMetrics);
  const [loadedKey, setLoadedKey] = useState("");
  const todayKey = site ? siteCalendarDate(site.timezone) : "";
  const dateKey =
    selectedDate && (!todayKey || selectedDate <= todayKey)
      ? selectedDate
      : todayKey;
  const viewingToday = Boolean(dateKey) && dateKey === todayKey;
  const loadKey = site ? `${site.siteId}:${dateKey}` : "";

  if (loadKey && loadKey !== loadedKey) {
    setLoadedKey(loadKey);
    setMetrics(blankMetrics);
  }

  useEffect(() => {
    if (!site || !dateKey) return undefined;
    let alive = true;
    const requests = overviewRequests(site, viewingToday ? "" : dateKey);

    const apply = (patch) =>
      alive && setMetrics((current) => ({ ...current, ...patch }));
    const fail = (key) =>
      alive &&
      setMetrics((current) => ({
        ...current,
        failed: { ...current.failed, [key]: true },
      }));

    requests.footfall
      .then((data) => apply({ footfall: data.footfall ?? 0 }))
      .catch(() => fail("footfall"));
    requests.previousFootfall
      .then((data) => apply({ previousFootfall: data.footfall ?? 0 }))
      .catch(() => fail("previousFootfall"));
    requests.dwell
      .then((data) => apply({ dwellMinutes: data.avgDwellMinutes ?? 0 }))
      .catch(() => fail("dwell"));
    requests.previousDwell
      .then((data) =>
        apply({ previousDwellMinutes: data.avgDwellMinutes ?? 0 }),
      )
      .catch(() => fail("previousDwell"));
    requests.occupancy
      .then((data) => apply({ occupancy: occupancyPoints(data.buckets) }))
      .catch(() => fail("occupancy"));
    requests.previousOccupancy
      .then((data) =>
        apply({ previousOccupancyAvg: previousOccupancyAverage(data.buckets) }),
      )
      .catch(() => fail("previousOccupancy"));
    requests.demographics
      .then((data) => apply({ demographics: demographicPoints(data.buckets) }))
      .catch(() => fail("demographics"));

    return () => {
      alive = false;
    };
  }, [site, dateKey, viewingToday]);

  const waitingForSite = !site && !sitesError;
  const occupancySeries = (metrics.occupancy || []).map((point, index, list) =>
    viewingToday && index === list.length - 1 && liveOccupancy != null
      ? { ...point, occupancy: liveOccupancy }
      : point,
  );
  const liveValue = viewingToday
    ? (liveOccupancy ?? null)
    : (metrics.occupancy?.at(-1)?.occupancy ?? null);

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
          {t("nav.overview")}
        </h1>
        <TodayButton />
      </div>

      <h2 className="mb-3 text-base font-medium">{t("metrics.occupancy")}</h2>
      {sitesError ? (
        <p className="mb-3 text-sm text-red-600">{t(sitesError)}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative grid overflow-hidden rounded-xl bg-white sm:grid-cols-2 lg:col-span-2">
          <span
            className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-neutral-200 sm:block"
            aria-hidden="true"
          />
          <MetricCard
            label={viewingToday ? t("metrics.live") : t("metrics.occupancy")}
            valueLoading={
              waitingForSite ||
              (!viewingToday &&
                metrics.occupancy == null &&
                !metrics.failed.occupancy)
            }
            changeLoading={
              metrics.previousOccupancyAvg == null &&
              !metrics.failed.previousOccupancy
            }
            value={liveValue == null ? "—" : formatCount(liveValue)}
            change={
              liveValue != null && metrics.previousOccupancyAvg != null
                ? compareToPrevious(liveValue, metrics.previousOccupancyAvg)
                : null
            }
          />
          <MetricCard
            className="border-t border-neutral-200 sm:border-t-0"
            label={
              viewingToday ? t("metrics.footfall") : t("metrics.footfallDay")
            }
            valueLoading={
              waitingForSite ||
              (metrics.footfall == null && !metrics.failed.footfall)
            }
            changeLoading={
              metrics.previousFootfall == null &&
              !metrics.failed.previousFootfall
            }
            value={
              metrics.footfall == null ? "—" : formatCount(metrics.footfall)
            }
            change={
              metrics.footfall != null && metrics.previousFootfall != null
                ? compareToPrevious(metrics.footfall, metrics.previousFootfall)
                : null
            }
          />
        </div>
        <div className="overflow-hidden rounded-xl bg-white">
          <MetricCard
            label={t("metrics.dwell")}
            valueLoading={
              waitingForSite ||
              (metrics.dwellMinutes == null && !metrics.failed.dwell)
            }
            changeLoading={
              metrics.previousDwellMinutes == null &&
              !metrics.failed.previousDwell
            }
            value={
              metrics.dwellMinutes == null
                ? "—"
                : formatDwell(metrics.dwellMinutes)
            }
            change={
              metrics.dwellMinutes != null &&
              metrics.previousDwellMinutes != null
                ? compareToPrevious(
                    metrics.dwellMinutes,
                    metrics.previousDwellMinutes,
                  )
                : null
            }
          />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {waitingForSite ||
        (metrics.occupancy == null && !metrics.failed.occupancy) ? (
          <ChartSkeleton />
        ) : occupancySeries.length ? (
          <OccupancyChart points={occupancySeries} live={viewingToday} />
        ) : metrics.failed.occupancy ? (
          <p className="text-sm text-red-600">{t("errors.metrics")}</p>
        ) : null}

        {waitingForSite ||
        metrics.demographics == null ||
        metrics.demographics.length ? (
          <h2 className="text-base font-medium">{t("charts.demographics")}</h2>
        ) : null}
        {waitingForSite ||
        (metrics.demographics == null && !metrics.failed.demographics) ? (
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : metrics.demographics?.length ? (
          <DemographicsCharts
            points={metrics.demographics}
            gender={viewingToday ? liveGender : undefined}
          />
        ) : metrics.failed.demographics ? (
          <p className="text-sm text-red-600">{t("errors.metrics")}</p>
        ) : null}
      </div>
    </section>
  );
}
