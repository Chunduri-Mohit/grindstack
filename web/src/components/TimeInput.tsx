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
      <div className="relative bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col items-center">
        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
          {label}
        </span>
        <span className="text-xl font-bold text-on-surface">{formatTo12h(value)}</span>
        <input
          type="time"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface-container-low border border-white/5 rounded-lg p-3 flex items-center justify-between">
      <span className="font-label-caps text-[10px] text-on-surface-variant">{label}</span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent text-sm text-on-surface font-semibold outline-none border-none w-16 text-right"
      />
    </div>
  );
};
