import React from "react";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  accentColor?: string;
  centerValue: string | number;
  centerText: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 140,
  strokeWidth = 10,
  accentColor = "var(--accent-orange)",
  centerValue,
  centerText
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="progress-circle-container" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="progress-circle-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-circle-bar"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ stroke: accentColor }}
        />
      </svg>
      <div className="progress-circle-text">
        <span className="bold text-lg" style={{ color: "var(--text-primary)" }}>{centerValue}</span>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{centerText}</span>
      </div>
    </div>
  );
};
