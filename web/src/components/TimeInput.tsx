import React from "react";

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  variant?: "compact" | "full";
}

export const TimeInput: React.FC<TimeInputProps> = ({
  label,
  value,
  onChange,
  variant = "full"
}) => {
  const formatTo12h = (time24: string): string => {
    try {
      const [h, m] = time24.split(":").map(Number);
      const suffix = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
    } catch {
      return time24;
    }
  };

  if (variant === "compact") {
    return (
      <div className="time-input-compact">
        <span className="time-input-label">{label}</span>
        <span className="time-input-display">{formatTo12h(value)}</span>
        <input
          type="time"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="time-input-native"
          aria-label={label}
        />
      </div>
    );
  }

  return (
    <div className="time-input-compact" style={{ minHeight: 54, flexDirection: "row", justifyContent: "space-between" }}>
      <span className="time-input-label" style={{ marginBottom: 0 }}>{label}</span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="select-input"
        style={{ width: 106, padding: 8, textAlign: "right" }}
        aria-label={label}
      />
    </div>
  );
};
