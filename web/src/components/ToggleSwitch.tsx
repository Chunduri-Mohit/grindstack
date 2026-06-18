import React from "react";

interface ToggleSwitchProps {
  icon?: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  variant?: "default" | "icon-only";
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  icon,
  title,
  description,
  checked,
  onChange,
  variant = "default"
}) => {
  if (variant === "icon-only") {
    return (
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-on-surface-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-on-primary"></div>
      </label>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors border border-white/5">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-card-title text-sm text-on-surface font-semibold">{title}</span>
          <span className="font-body text-xs text-on-surface-variant leading-tight mt-0.5">
            {description}
          </span>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-on-surface-variant after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-on-primary"></div>
      </label>
    </div>
  );
};
