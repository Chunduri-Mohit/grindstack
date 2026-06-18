import React, { useMemo, useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import { localDb } from "../db/localDb";
import type { DailyHabits, Task } from "../db/localDb";
import { GlassCard } from "../components/GlassCard";
import { CircularProgress } from "../components/CircularProgress";
import { LineChart } from "../components/LineChart";

type TaskFilter = "all" | "open" | "tech" | "health" | "discipline";

const FILTERS: Array<{ key: TaskFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "tech", label: "Tech" },
  { key: "health", label: "Health" },
  { key: "discipline", label: "Discipline" }
];

const CATEGORY_OPTIONS = [
  { key: "tech", label: "Tech" },
  { key: "health", label: "Health" },
  { key: "discipline", label: "Discipline" }
];

const taskMatchesFilter = (task: Task, filter: TaskFilter) => {
  const category = task.category.toLowerCase();
  if (filter === "all") return true;
  if (filter === "open") return !task.isCompleted;
  if (filter === "tech") return category === "tech";
  if (filter === "health") return category === "health";
  return category === "discipline" || (category !== "tech" && category !== "health");
};

const categoryLabel = (category: string) => {
  const clean = category.toLowerCase();
  if (clean === "tech") return "TECH";
  if (clean === "health") return "HEALTH";
  if (clean === "discipline") return "DISCIPLINE";
  return "GOAL";
};

const normalizeCategory = (category: string) => {
  const clean = category.toLowerCase();
  return clean === "tech" || clean === "health" || clean === "discipline"
    ? clean
    : "discipline";
};

const reorderVisibleTasks = (
  allTasks: Task[],
  filter: TaskFilter,
  reorderedVisibleTasks: Task[]
) => {
  let visibleIndex = 0;
  return allTasks.map(task => {
    if (taskMatchesFilter(task, filter) && visibleIndex < reorderedVisibleTasks.length) {
      return reorderedVisibleTasks[visibleIndex++];
    }
    return task;
  });
};

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

export const DashboardScreen: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => localDb.getTasks());
  const [habitsHistory, setHabitsHistory] = useState<DailyHabits[]>(() => localDb.getAllHabits());
  const [selectedFilter, setSelectedFilter] = useState<TaskFilter>("all");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("tech");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("tech");
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const dragSourceTaskIdRef = useRef<string | null>(null);
  const dragOverTaskIdRef = useRef<string | null>(null);
  const taskRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const incompleteTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const level = Math.floor(profile.xp / 100) + 1;

  const visibleTasks = useMemo(
    () => tasks.filter(task => taskMatchesFilter(task, selectedFilter)),
    [tasks, selectedFilter]
  );

  const nextTask = useMemo(
    () => tasks.find(task => !task.isCompleted) ?? null,
    [tasks]
  );

  const toggleTask = async (task: Task, isCompleted: boolean) => {
    const { tasks: updatedTasks } = await localDb.toggleTaskCompletion(task.id, isCompleted);
    setTasks(updatedTasks);
    setHabitsHistory(localDb.getAllHabits());
    await refreshProfile();
  };

  const addTask = () => {
    const trimmed = newTaskName.trim();
    if (!trimmed) return;
    setTasks(localDb.createCustomTask(trimmed, newTaskCategory));
    setNewTaskName("");
    setNewTaskCategory("tech");
    setShowQuickAdd(false);
    setSelectedFilter("all");
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEditName(task.name);
    setEditCategory(normalizeCategory(task.category));
  };

  const saveEditTask = () => {
    if (!editingTask || !editName.trim()) return;
    setTasks(localDb.updateTask(editingTask.id, editName, editCategory));
    setEditingTask(null);
  };

  const deleteEditingTask = () => {
    if (!editingTask) return;
    setTasks(localDb.deleteTask(editingTask.id));
    setEditingTask(null);
  };

  const persistTaskOrder = (orderedTasks: Task[]) => {
    setTasks(orderedTasks);
    localDb.reorderTasks(orderedTasks.map(task => task.id));
  };

  const setActiveDropTarget = (taskId: string | null) => {
    dragOverTaskIdRef.current = taskId;
    setDragOverTaskId(taskId);
  };

  const findTaskIdAtPoint = (clientY: number) => {
    const positionedRows = visibleTasks
      .map(task => {
        const element = taskRowRefs.current[task.id];
        return element ? { task, rect: element.getBoundingClientRect() } : null;
      })
      .filter((entry): entry is { task: Task; rect: DOMRect } => Boolean(entry));

    const directHit = positionedRows.find(({ rect }) => (
      clientY >= rect.top && clientY <= rect.bottom
    ));
    if (directHit) return directHit.task.id;

    return positionedRows.reduce<{ id: string | null; distance: number }>(
      (closest, { task, rect }) => {
        const centerY = rect.top + rect.height / 2;
        const distance = Math.abs(clientY - centerY);
        return distance < closest.distance ? { id: task.id, distance } : closest;
      },
      { id: null, distance: Number.POSITIVE_INFINITY }
    ).id;
  };

  const beginReorder = (taskId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragSourceTaskIdRef.current = taskId;
    setDraggingTaskId(taskId);
    setActiveDropTarget(taskId);
  };

  const moveReorderTarget = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragSourceTaskIdRef.current) return;
    const targetTaskId = findTaskIdAtPoint(event.clientY);
    if (targetTaskId && targetTaskId !== dragOverTaskIdRef.current) {
      setActiveDropTarget(targetTaskId);
    }
  };

  const finishReorder = () => {
    const sourceTaskId = dragSourceTaskIdRef.current;
    const targetTaskId = dragOverTaskIdRef.current;

    if (!sourceTaskId || !targetTaskId || sourceTaskId === targetTaskId) {
      dragSourceTaskIdRef.current = null;
      setDraggingTaskId(null);
      setActiveDropTarget(null);
      return;
    }

    const fromIndex = visibleTasks.findIndex(task => task.id === sourceTaskId);
    const toIndex = visibleTasks.findIndex(task => task.id === targetTaskId);
    if (fromIndex === -1 || toIndex === -1) {
      dragSourceTaskIdRef.current = null;
      setDraggingTaskId(null);
      setActiveDropTarget(null);
      return;
    }

    const reorderedVisible = moveItem(visibleTasks, fromIndex, toIndex);
    persistTaskOrder(reorderVisibleTasks(tasks, selectedFilter, reorderedVisible));
    dragSourceTaskIdRef.current = null;
    setDraggingTaskId(null);
    setActiveDropTarget(null);
  };

  const getWeeklyChartData = () => {
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const today = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - index));
      const dateFormat = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const habit = habitsHistory.find(h => h.dateString === dateFormat);
      const value = habit
        ? Number(habit.gymCompleted) + Number(habit.dietCompleted) + Number(habit.skincareCompleted) + Number(habit.sleepCompleted)
        : 0;

      return {
        day: days[d.getDay()],
        value
      };
    });
  };

  const remainingGrace = Math.max(0, profile.graceDaysAllowedThisWeek - profile.graceDaysUsedThisWeek);
  const statusText = totalTasks === 0
    ? "Add a goal"
    : completedTasks === totalTasks
      ? "Safe today"
      : remainingGrace === 0
        ? "No grace left"
        : `${remainingGrace} grace left`;

  const hour = new Date().getHours();
  const greeting = hour >= 5 && hour <= 11
    ? "Good morning"
    : hour >= 12 && hour <= 16
      ? "Good afternoon"
      : hour >= 17 && hour <= 21
        ? "Good evening"
        : "Late night grind";

  return (
    <div className="screen-content dashboard-screen">
      <div className="dashboard-header">
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{greeting}</p>
          <h2 className="bold" style={{ fontSize: "28px", margin: "2px 0" }}>{profile.username}</h2>
          <div className="dashboard-stat-row">
            <span>Level {level}</span>
            <span>{profile.xp} XP</span>
          </div>
        </div>
        <span className="badge badge-orange">
          {incompleteTasks === 0 ? "Clear" : `${incompleteTasks} left`}
        </span>
      </div>

      <GlassCard className="dashboard-overview-card">
        <div className="dashboard-overview-copy">
          <p className="text-xs dashboard-section-label">Today</p>
          <div className="dashboard-progress-count">
            <span>{completedTasks}</span>
            <small>/ {totalTasks} done</small>
          </div>
          <div className="dashboard-progress-track">
            <div style={{ width: `${completionPercentage}%` }} />
          </div>
          <div className="dashboard-stat-row">
            <span>Streak {profile.longestStreak}d</span>
            <span>{statusText}</span>
          </div>
        </div>
        <CircularProgress
          percentage={completionPercentage}
          size={104}
          strokeWidth={8}
          centerValue={`${completionPercentage}%`}
          centerText="Done"
        />
      </GlassCard>

      <GlassCard className="dashboard-next-card">
        <div>
          <p className="text-xs dashboard-section-label">{nextTask ? "Next action" : "All clear"}</p>
          <h3>{nextTask?.name ?? "You finished today's checklist."}</h3>
        </div>
        {nextTask ? (
          <div className="dashboard-next-actions">
            <button className="btn btn-accent" onClick={() => toggleTask(nextTask, true)}>Mark done</button>
            <button className="btn btn-secondary btn-icon-only" onClick={() => setShowQuickAdd(true)} aria-label="Add task">
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setShowQuickAdd(true)}>Add another task</button>
        )}
      </GlassCard>

      <section className="dashboard-task-section">
        <div className="dashboard-task-header">
          <h3>Tasks</h3>
          <button className="btn btn-secondary btn-icon-only" onClick={() => setShowQuickAdd(prev => !prev)} aria-label="Add task">
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
          </button>
        </div>
        <div className="dashboard-filter-row">
          {FILTERS.map(filter => (
            <button
              key={filter.key}
              className={`dashboard-filter-pill ${selectedFilter === filter.key ? "active" : ""}`}
              onClick={() => setSelectedFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {showQuickAdd && (
        <GlassCard className="dashboard-editor-card">
          <h3>New task</h3>
          <input
            className="text-input"
            value={newTaskName}
            onChange={event => setNewTaskName(event.target.value)}
            placeholder="What needs to get done?"
          />
          <CategorySelector value={newTaskCategory} onChange={setNewTaskCategory} />
          <div className="dashboard-dialog-actions">
            <button className="btn btn-secondary" onClick={() => setShowQuickAdd(false)}>Cancel</button>
            <button className="btn btn-accent" onClick={addTask} disabled={!newTaskName.trim()}>Add task</button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="dashboard-task-list-card">
        {visibleTasks.length === 0 ? (
          <div className="dashboard-empty-state">
            {selectedFilter === "open" ? "No open tasks." : "No tasks in this view."}
          </div>
        ) : (
          visibleTasks.map(task => (
            <div
              key={task.id}
              ref={element => {
                taskRowRefs.current[task.id] = element;
              }}
              className={`dashboard-task-row ${task.isCompleted ? "completed" : ""} ${draggingTaskId === task.id ? "dragging" : ""} ${dragOverTaskId === task.id && draggingTaskId !== task.id ? "drop-target" : ""}`}
            >
              <button
                className={`dashboard-task-checkbox ${task.isCompleted ? "checked" : ""}`}
                onClick={() => toggleTask(task, !task.isCompleted)}
                aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
              >
                {task.isCompleted && (
                  <span className="material-symbols-outlined" aria-hidden="true">check</span>
                )}
              </button>
              <button className="dashboard-task-copy" onClick={() => openEditTask(task)}>
                <span>{task.name}</span>
                <small>{categoryLabel(task.category)}{task.streak > 0 ? ` / ${task.streak}d` : ""}</small>
              </button>
              <button className="dashboard-icon-button" onClick={() => openEditTask(task)} aria-label="Edit task">
                <span className="material-symbols-outlined" aria-hidden="true">edit</span>
              </button>
              <button
                className="dashboard-drag-handle"
                type="button"
                aria-label="Drag to reorder task"
                onPointerDown={event => beginReorder(task.id, event)}
                onPointerMove={moveReorderTarget}
                onPointerUp={finishReorder}
                onPointerCancel={finishReorder}
              >
                <span className="material-symbols-outlined" aria-hidden="true">drag_indicator</span>
              </button>
            </div>
          ))
        )}
      </GlassCard>

      <GlassCard style={{ padding: "20px 24px" }}>
        <LineChart
          data={getWeeklyChartData()}
          title="Weekly Consistency Tracker"
          description="Habits completed each day"
          color="var(--accent-lime)"
          maxValue={4}
        />
      </GlassCard>

      {editingTask && (
        <div className="dashboard-modal-backdrop">
          <GlassCard className="dashboard-modal-card">
            <h3>Edit task</h3>
            <input
              className="text-input"
              value={editName}
              onChange={event => setEditName(event.target.value)}
              placeholder="Task name"
            />
            <CategorySelector value={editCategory} onChange={setEditCategory} />
            <button className="dashboard-delete-link" onClick={deleteEditingTask}>Delete task</button>
            <div className="dashboard-dialog-actions">
              <button className="btn btn-secondary" onClick={() => setEditingTask(null)}>Cancel</button>
              <button className="btn btn-accent" onClick={saveEditTask} disabled={!editName.trim()}>Save</button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

const CategorySelector: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="dashboard-category-row">
      {CATEGORY_OPTIONS.map(category => (
        <button
          key={category.key}
          className={`dashboard-category-pill ${value === category.key ? "active" : ""}`}
          onClick={() => onChange(category.key)}
          type="button"
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};
