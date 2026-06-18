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
  colorClass = "var(--accent-lime)"
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
            <button
              key={item.key}
              type="button"
              className="habit-row"
              onClick={() => onToggle(item.key)}
              style={{ padding: "10px 0" }}
            >
              <span className={`circle-status ${item.checked ? "checked" : ""}`} aria-hidden="true">
                {item.checked && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
              </span>
              <span
                className={`checklist-label ${item.checked ? "completed" : ""}`}
                style={{ flex: 1, textAlign: "left" }}
              >
                {item.title}
                {item.streak && item.streak > 0 && (
                  <span className="text-xs" style={{ marginLeft: "8px", color: "var(--accent-lime)" }}>{item.streak}d</span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-column" style={{ gap: 10 }}>
      {(title || description) && (
        <div>
          {title && <h3 className="section-label">{title}</h3>}
          {description && <p className="text-xs" style={{ marginTop: 4 }}>{description}</p>}
        </div>
      )}
      <div className="flex-column" style={{ gap: 8 }}>
        {items.map(item => (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggle(item.key)}
            className="habit-row glass-panel"
          >
            <div className="log-row" style={{ padding: 0, justifyContent: "flex-start", minWidth: 0 }}>
              {item.icon && (
                <span
                  className="row-icon"
                  style={{ background: item.checked ? "rgba(201, 242, 76, 0.16)" : "rgba(255,255,255,0.05)" }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
                </span>
              )}
              <div style={{ minWidth: 0, textAlign: "left" }}>
                <p className="habit-title">{item.title}</p>
                {item.category && <p className="habit-subtitle">{item.category.toUpperCase()}</p>}
              </div>
            </div>
            <span className={`circle-status ${item.checked ? "checked" : ""}`} aria-hidden="true">
              {item.checked && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
