import React, { useId, useMemo } from "react";

interface DataPoint {
  day: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
  color?: string;
  maxValue?: number;
}

const CHART_PADDING = { top: 20, right: 10, bottom: 30, left: 40 };

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title = "Weekly Progress",
  description,
  color = "var(--accent-lime)",
  maxValue
}) => {
  const chartHeight = 160;
  const chartWidth = 400;
  const gradientId = `gradient-${useId().replace(/:/g, "")}`;

  // Calculate max value for scaling
  const max = maxValue || Math.max(...data.map(d => d.value), 4);
  const min = 0;

  // Generate SVG path
  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = CHART_PADDING.left + (i / (data.length - 1 || 1)) * (chartWidth - CHART_PADDING.left - CHART_PADDING.right);
      const y = CHART_PADDING.top + (chartHeight - CHART_PADDING.top - CHART_PADDING.bottom) * (1 - (d.value - min) / (max - min || 1));
      return { x, y, value: d.value };
    });
  }, [data, max]);

  // Create SVG path string for line
  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }, [points]);

  return (
    <div className="line-chart-container">
      {title && (
        <div>
          <h3 className="line-chart-title">
            {title}
          </h3>
          {description && (
            <p className="line-chart-description">{description}</p>
          )}
        </div>
      )}

      <div style={{ overflowX: "auto", paddingBottom: 2 }}>
        <svg
          width="100%"
          height="220"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="line-chart-svg"
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.02 }} />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
            <line
              key={`grid-${i}`}
              x1={CHART_PADDING.left}
              y1={CHART_PADDING.top + tick * (chartHeight - CHART_PADDING.top - CHART_PADDING.bottom)}
              x2={chartWidth - CHART_PADDING.right}
              y2={CHART_PADDING.top + tick * (chartHeight - CHART_PADDING.top - CHART_PADDING.bottom)}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.5"
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
            const value = Math.round(max - tick * (max - min));
            return (
              <text
                key={`label-${i}`}
                x={CHART_PADDING.left - 8}
                y={CHART_PADDING.top + tick * (chartHeight - CHART_PADDING.top - CHART_PADDING.bottom) + 4}
                textAnchor="end"
                fontSize="10"
                fill="rgba(255,255,255,0.4)"
              >
                {value}
              </text>
            );
          })}

          {/* Y-axis */}
          <line
            x1={CHART_PADDING.left}
            y1={CHART_PADDING.top}
            x2={CHART_PADDING.left}
            y2={chartHeight - CHART_PADDING.bottom}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* X-axis */}
          <line
            x1={CHART_PADDING.left}
            y1={chartHeight - CHART_PADDING.bottom}
            x2={chartWidth - CHART_PADDING.right}
            y2={chartHeight - CHART_PADDING.bottom}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {/* Fill under line */}
          {pathD && (
            <path
              d={`${pathD} L ${points[points.length - 1]?.x || 0} ${chartHeight - CHART_PADDING.bottom} L ${CHART_PADDING.left} ${chartHeight - CHART_PADDING.bottom} Z`}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Main line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {points.map((p, i) => (
            <g key={`point-${i}`}>
              <circle cx={p.x} cy={p.y} r="2.5" fill={color} opacity="0.8" />
              <circle cx={p.x} cy={p.y} r="4.5" fill={color} opacity="0.2" />
            </g>
          ))}

          {/* X-axis labels (days) */}
          {data.map((d, i) => {
            const x = CHART_PADDING.left + (i / (data.length - 1 || 1)) * (chartWidth - CHART_PADDING.left - CHART_PADDING.right);
            return (
              <text
                key={`day-${i}`}
                x={x}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(255,255,255,0.5)"
              >
                {d.day}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Data summary */}
      <div className="line-chart-stats">
        <span>Min: {data.length > 0 ? Math.min(...data.map(d => d.value)) : 0}</span>
        <span>Avg: {data.length > 0 ? Math.round(data.reduce((a, d) => a + d.value, 0) / data.length) : 0}</span>
        <span>Max: {data.length > 0 ? Math.max(...data.map(d => d.value)) : 0}</span>
      </div>
    </div>
  );
};
