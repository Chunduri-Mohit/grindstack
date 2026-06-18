import React from "react";

export interface HabitItem {
  key: string;
  title: string;
  checked: boolean;
  icon?: string;
  category?: "tech" | "health" | "discipline";
  streak?: number;
}

interface HabitChecklistProps {
  title: string;
  description?: string;
  items: HabitItem[];
  onToggle: (key: string) => void;
  variant?: "default" | "minimal";
  colorClass?: string;
}

export const HabitChecklist: React.FC<HabitChecklistProps> = ({
  title,
  description,
  items,
  onToggle,
  variant = "default",
  colorClass = "var(--accent-green)"
}) => {
  if (variant === "minimal") {
    return (
      <div className="glass-panel rounded-xl p-4">
        <div style={{ marginBottom: "10px" }}>
          <h3 className="bold text-sm" style={{ letterSpacing: "0.5px", color: colorClass }}>
            {title}
          </h3>
          {description && (
            <p className="text-xs" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              {description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {items.map(item => (
            <div key={item.key} className="checklist-item">
              <div 
                className={`checkbox-custom ${item.checked ? "checked" : ""}`}
                onClick={() => onToggle(item.key)}
                style={{ borderColor: colorClass }}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span 
                className={`checklist-label ${item.checked ? "completed" : ""}`}
                onClick={() => onToggle(item.key)}
              >
                {item.title}
                {item.streak && item.streak > 0 && (
                  <span className="text-xs" style={{ marginLeft: "8px", color: "var(--accent-green)" }}>⚡ {item.streak}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default variant with modern styling
  return (
    <div className="space-y-2">
      {description && (
        <div className="px-1">
          <h3 className="font-label-caps text-[10px] text-on-surface-variant tracking-widest uppercase mb-2">
            {title}
          </h3>
          <p className="text-xs text-on-surface-variant">{description}</p>
        </div>
      )}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.key}
            onClick={() => onToggle(item.key)}
            className="glass-panel rounded-xl p-4 flex items-center justify-between group hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              {item.icon && (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 transition-colors ${
                  item.checked ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-container text-on-surface-variant group-hover:text-primary"
                }`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-card-title text-sm text-on-surface font-semibold">{item.title}</span>
                {item.category && (
                  <span className="font-body text-[11px] text-emerald-400 font-semibold mt-0.5">
                    {item.category.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Circle Checkbox */}
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              item.checked 
                ? "bg-emerald-500 border-emerald-500 text-black" 
                : "border-white/20"
            }`}>
              {item.checked && (
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
