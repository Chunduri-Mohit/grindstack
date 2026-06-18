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
      <label className="toggle-control">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span className="toggle-slider" />
      </label>
    );
  }

  return (
    <div className="toggle-switch-container">
      <div className="toggle-switch-copy">
        {icon && (
          <span className="toggle-switch-icon">
            <span className="material-symbols-outlined">{icon}</span>
          </span>
        )}
        <div>
          <p className="toggle-switch-label">{title}</p>
          <p className="toggle-switch-description">
            {description}
          </p>
        </div>
      </div>
      <label className="toggle-control">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span className="toggle-slider" />
      </label>
    </div>
  );
};
