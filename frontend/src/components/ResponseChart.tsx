import { useState, useEffect, useMemo } from 'react';
import * as monitorsApi from '../api/monitors';

interface Props {
  monitorId: string;
}

const PERIODS = [
  { key: 'day', label: '24h' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: '30 days' },
] as const;

export default function ResponseChart({ monitorId }: Props) {
  const [rawData, setRawData] = useState<
    Array<{ time: string; value: number }>
  >([]);
  const [period, setPeriod] = useState<string>('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    monitorsApi
      .getResponseTimeData(monitorId, period)
      .then(setRawData)
      .catch(() => setRawData([]))
      .finally(() => setLoading(false));
  }, [monitorId, period]);

  const chartData = useMemo(() => {
    if (rawData.length === 0) return null;

    const max = Math.max(...rawData.map((d) => d.value), 1);
    const paddedMax = max * 1.15;
    const width = 600;
    const height = 180;
    const padLeft = 45;
    const padRight = 10;
    const padTop = 10;
    const padBottom = 25;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const points = rawData.map((d, i) => {
      const x = i === 0 ? 0 : (i / (rawData.length - 1)) * chartW;
      const y = chartH - (d.value / paddedMax) * chartH;
      return { x, y, ...d };
    });

    const pathD = points
      .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
      .join(' ');

    const yTicks = 4;
    const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
      Math.round((paddedMax / yTicks) * i)
    );

    const xLabels: Array<{ idx: number; label: string }> = [];
    const maxLabels = period === 'day' ? 6 : period === 'week' ? 7 : 5;
    const step = Math.max(1, Math.floor(rawData.length / (maxLabels - 1)));
    for (let i = 0; i < rawData.length; i += step) {
      xLabels.push({ idx: i, label: formatLabel(rawData[i].time, period) });
    }
    if (xLabels.length > 0 && xLabels[xLabels.length - 1].idx !== rawData.length - 1) {
      xLabels.push({
        idx: rawData.length - 1,
        label: formatLabel(rawData[rawData.length - 1].time, period),
      });
    }

    return { points, pathD, yTickValues, width, height, padLeft, padRight, padTop, padBottom, chartW, chartH, xLabels, paddedMax };
  }, [rawData, period]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-48 bg-gray-200 rounded" />
      </div>
    );
  }

  if (rawData.length < 2) {
    return (
      <div className="bg-white rounded-lg border border-dashed border-gray-300 p-5 text-center">
        <p className="text-gray-400 text-sm">
          {rawData.length === 0
            ? 'No response time data yet'
            : 'Need more data points for a chart'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Response Time</h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                period === p.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartData!.width} ${chartData!.height}`}
          className="w-full"
          style={{ minWidth: 300 }}
        >
          {/* Grid lines */}
          {chartData!.yTickValues.map((v) => {
            const y = chartData!.padTop + chartData!.chartH - (v / chartData!.paddedMax) * chartData!.chartH;
            return (
              <g key={v}>
                <line
                  x1={chartData!.padLeft}
                  y1={y}
                  x2={chartData!.width - chartData!.padRight}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartData!.padLeft - 5}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {v}ms
                </text>
              </g>
            );
          })}

          {/* Line */}
          <path
            d={chartData!.pathD}
            transform={`translate(${chartData!.padLeft}, ${chartData!.padTop})`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />

          {/* Dots */}
          {chartData!.points.map((p, i) => (
            <circle
              key={i}
              cx={chartData!.padLeft + p.x}
              cy={chartData!.padTop + p.y}
              r="2"
              fill="#3b82f6"
            />
          ))}

          {/* X labels */}
          {chartData!.xLabels.map((xl) => {
            const x =
              chartData!.padLeft +
              (xl.idx / (rawData.length - 1)) * chartData!.chartW;
            return (
              <text
                key={xl.idx}
                x={x}
                y={chartData!.height - 4}
                textAnchor="middle"
                className="text-[10px] fill-gray-400"
              >
                {xl.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function formatLabel(iso: string, period: string): string {
  const d = new Date(iso);
  if (period === 'day') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
