import { useTranslation } from "react-i18next";
import { User } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function LiveTag({ viewBox, label }) {
  const x = viewBox?.x ?? 0;
  return (
    <g>
      <rect x={x - 18} y={4} width={36} height={16} rx={2} fill="#ef4444" />
      <text x={x} y={15} textAnchor="middle" fill="#fff" fontSize="10">
        {label}
      </text>
    </g>
  );
}

function Dot({ color }) {
  return (
    <span
      className="inline-block size-2 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

export function OccupancyChart({ points, live = false }) {
  const { t } = useTranslation();
  const liveTime = live ? points.at(-1)?.time : null;
  const occupancyConfig = {
    occupancy: { label: t("charts.occupancy"), color: "#6fb3ac" },
  };

  return (
    <article className="rounded-xl bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("charts.overall")}</h3>
        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Dot color="#6fb3ac" /> {t("charts.occupancy")}
        </span>
      </div>
      <ChartContainer
        config={occupancyConfig}
        className="aspect-auto h-64 w-full"
      >
        <AreaChart
          data={points}
          margin={{ top: 24, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fontSize: 11 }}
            domain={[
              (min) => Math.max(0, Math.floor(min - 30)),
              (max) => Math.ceil(max + 20),
            ]}
            label={{
              value: t("charts.count"),
              angle: -90,
              position: "insideLeft",
              offset: 8,
              style: { fontSize: 11, fill: "#737373" },
            }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="occupancy"
            stroke="var(--color-occupancy)"
            fill="var(--color-occupancy)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          {liveTime ? (
            <ReferenceLine
              x={liveTime}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={(props) => <LiveTag {...props} label={t("charts.live")} />}
            />
          ) : null}
        </AreaChart>
      </ChartContainer>
      <p className="text-center text-xs text-neutral-500">{t("charts.time")}</p>
    </article>
  );
}

export function DemographicsCharts({ points, gender }) {
  const { t } = useTranslation();
  const demographicConfig = {
    male: { label: t("charts.male"), color: "#7f9d99" },
    female: { label: t("charts.female"), color: "#b7e3de" },
  };
  const latest = points.at(-1);
  const male = gender?.male ?? latest?.male ?? 0;
  const female = gender?.female ?? latest?.female ?? 0;
  const total = male + female;
  const maleShare = total ? Math.round((male / total) * 100) : 0;
  const femaleShare = total ? 100 - maleShare : 0;
  const slices = [
    { key: "male", name: t("charts.male"), value: male || 0 },
    { key: "female", name: t("charts.female"), value: female || 0 },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <article className="rounded-xl bg-white p-4">
        <h3 className="text-sm font-medium">{t("charts.donut")}</h3>
        <div className="relative mx-auto h-52 w-full">
          <ChartContainer
            config={demographicConfig}
            className="aspect-auto h-full w-full"
          >
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={78}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-xs text-neutral-500">{t("charts.total")}</p>
              <p className="text-lg font-semibold">100%</p>
            </div>
          </div>
        </div>
        <div className="mt-1 space-y-1 text-sm text-neutral-600">
          <p className="flex items-center gap-2">
            <User className="size-4" style={{ color: "#7f9d99" }} />
            {t("charts.males", { percent: maleShare })}
          </p>
          <p className="flex items-center gap-2">
            <User className="size-4" style={{ color: "#b7e3de" }} />
            {t("charts.females", { percent: femaleShare })}
          </p>
        </div>
      </article>

      <article className="rounded-xl bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium">{t("charts.analysis")}</h3>
          <span className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Dot color="#7f9d99" /> {t("charts.male")}
            </span>
            <span className="flex items-center gap-1.5">
              <Dot color="#b7e3de" /> {t("charts.female")}
            </span>
          </span>
        </div>
        <ChartContainer
          config={demographicConfig}
          className="aspect-auto h-64 w-full"
        >
          <AreaChart
            data={points}
            margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fontSize: 11 }}
              domain={[
                (min) => Math.max(0, Math.floor(min - 20)),
                (max) => Math.ceil(max + 15),
              ]}
              label={{
                value: t("charts.count"),
                angle: -90,
                position: "insideLeft",
                offset: 8,
                style: { fontSize: 11, fill: "#737373" },
              }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="male"
              stroke="var(--color-male)"
              fill="var(--color-male)"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="female"
              stroke="var(--color-female)"
              fill="var(--color-female)"
              fillOpacity={0.45}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <p className="text-center text-xs text-neutral-500">
          {t("charts.time")}
        </p>
      </article>
    </div>
  );
}
