"use client";

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SearchFilter, DateFilter } from "@/components/SearchFilter";
import { TaskInput } from "@/components/TaskInput";
import { TaskList } from "@/components/TaskList";
import { ProgressBar } from "@/components/ProgressBar";
import { BulkActionBar } from "@/components/BulkActionBar";
import { SpinModal } from "@/components/SpinModal";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { DeleteProjectModal } from "@/components/DeleteProjectModal";
import { DeleteRoadmapModal } from "@/components/DeleteRoadmapModal";
import { RoadmapView } from "@/components/RoadmapView";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useRoadmaps } from "@/hooks/useRoadmaps";
import { generateAIExportPrompt, downloadExport } from "@/lib/exportForAI";
import { useKeyboardShortcuts, Shortcut } from "@/hooks/useKeyboardShortcuts";
import { showToast } from "@/hooks/useToast";
import { FilterTab, ProjectFilter } from "@/types/task";

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function daysOld(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(task: { completed: boolean; hiddenUntil: string | null; createdAt: string }): boolean {
  if (task.completed) return false;
  if (task.hiddenUntil && new Date(task.hiddenUntil) > new Date()) return false;
  return daysOld(task.createdAt) >= 7;
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();

  // Sidebar state
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const projectParam = searchParams.get("project");
    const roadmapParam = searchParams.get("roadmap");
    if (projectParam) setProjectFilter(projectParam);
    else if (roadmapParam) setProjectFilter(`roadmap:${roadmapParam}`);
  }, [searchParams]);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterTab>("active");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Modal state
  const [spinOpen, setSpinOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteRoadmapId, setDeleteRoadmapId] = useState<string | null>(null);

  // Refs
  const taskInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Data hooks
  const { tasks, isLoading, isError, addTask, addTasksBatch, isAdding, isMutating, toggleTask, editTask, editNotes, assignToProject, setRecurrence, deleteTask, bulkDelete, bulkUpdate } = useTasks();
  const { projects, addProject, removeProject, isAdding: isAddingProject, isMutating: isProjectMutating } = useProjects();
  const { roadmaps, addRoadmap, removeRoadmap, isAdding: isAddingRoadmap, isMutating: isRoadmapMutating } = useRoadmaps();

  // Check if a roadmap is selected
  const isRoadmapView = projectFilter.startsWith("roadmap:");
  const activeRoadmapId = isRoadmapView ? projectFilter.slice(8) : null;
  const activeRoadmap = activeRoadmapId ? roadmaps.find(r => r.id === activeRoadmapId) ?? null : null;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectionActive = selectedIds.size > 0;

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Filter tasks (exclude roadmap tasks from normal views)
  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => !t.roadmapId);

    // Sidebar project filter
    if (projectFilter === "inbox") {
      result = result.filter((t) => t.projectId === null);
    } else if (projectFilter !== "all" && !isRoadmapView) {
      result = result.filter((t) => t.projectId === projectFilter);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        if (t.title.toLowerCase().includes(q)) return true;
        if (t.notes?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    // Status filter
    if (statusFilter === "active") result = result.filter((t) => !t.completed && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date()));
    if (statusFilter === "completed") result = result.filter((t) => t.completed);
    if (statusFilter === "recurring") result = result.filter((t) => !t.completed && !!t.hiddenUntil && new Date(t.hiddenUntil) > new Date());
    if (statusFilter === "overdue") result = result.filter((t) => isOverdue(t));

    // Date filter
    if (dateFilter === "today") result = result.filter((t) => isToday(t.createdAt));
    if (dateFilter === "week") result = result.filter((t) => isThisWeek(t.createdAt));
    if (dateFilter === "month") result = result.filter((t) => isThisMonth(t.createdAt));

    // Multi-project filter
    if (selectedProjects.length > 0) {
      result = result.filter((t) => {
        if (selectedProjects.includes("inbox") && t.projectId === null) return true;
        return selectedProjects.includes(t.projectId ?? "");
      });
    }

    return result;
  }, [tasks, projectFilter, searchQuery, statusFilter, dateFilter, selectedProjects, isRoadmapView]);

  // Visible task IDs (for selection pruning)
  const visibleTaskIds = useMemo(() => new Set(filteredTasks.map(t => t.id)), [filteredTasks]);

  useEffect(() => {
    setSelectedIds(prev => {
      const pruned = new Set([...prev].filter(id => visibleTaskIds.has(id)));
      return pruned.size === prev.size ? prev : pruned;
    });
  }, [visibleTaskIds]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(visibleTaskIds));
  }, [visibleTaskIds]);

  // Bulk actions
  const handleBulkDelete = useCallback(() => { bulkDelete([...selectedIds]); deselectAll(); }, [selectedIds, bulkDelete, deselectAll]);
  const handleBulkComplete = useCallback(() => { bulkUpdate([...selectedIds], { completed: true }); deselectAll(); }, [selectedIds, bulkUpdate, deselectAll]);
  const handleBulkIncomplete = useCallback(() => { bulkUpdate([...selectedIds], { completed: false }); deselectAll(); }, [selectedIds, bulkUpdate, deselectAll]);
  const handleBulkMove = useCallback((projectId: string | null) => { bulkUpdate([...selectedIds], { projectId }); deselectAll(); }, [selectedIds, bulkUpdate, deselectAll]);

  const copyTasksToClipboard = useCallback(() => {
    const selected = selectionActive ? selectedIds : new Set(filteredTasks.map(t => t.id));
    const lines = filteredTasks
      .filter(t => selected.has(t.id))
      .map((t, i) => `${i + 1}. ${t.title}`);
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      showToast(`${lines.length} tasks copied to clipboard`, "info");
    });
  }, [selectionActive, selectedIds, filteredTasks]);

  const handleExportForAI = useCallback(() => {
    const content = generateAIExportPrompt({ tasks, projects });
    downloadExport(content);
    navigator.clipboard.writeText(content).then(
      () => showToast("Copied to clipboard & downloading file", "success"),
      () => showToast("Downloading file", "success")
    );
  }, [tasks, projects]);

  // Counts
  const nonRoadmapTasks = useMemo(() => tasks.filter(t => !t.roadmapId), [tasks]);
  const sidebarScoped = useMemo(() => {
    if (projectFilter === "inbox") return nonRoadmapTasks.filter((t) => t.projectId === null);
    if (projectFilter !== "all" && !isRoadmapView) return nonRoadmapTasks.filter((t) => t.projectId === projectFilter);
    return nonRoadmapTasks;
  }, [nonRoadmapTasks, projectFilter, isRoadmapView]);

  const activeTasks = nonRoadmapTasks.filter((t) => !t.completed && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date()));
  const inboxCount = activeTasks.filter((t) => t.projectId === null).length;

  const statusCounts = useMemo(() => {
    let base = sidebarScoped;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter((t) => t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q));
    }
    if (dateFilter !== "all") {
      if (dateFilter === "today") base = base.filter((t) => isToday(t.createdAt));
      if (dateFilter === "week") base = base.filter((t) => isThisWeek(t.createdAt));
      if (dateFilter === "month") base = base.filter((t) => isThisMonth(t.createdAt));
    }
    if (selectedProjects.length > 0) {
      base = base.filter((t) => {
        if (selectedProjects.includes("inbox") && t.projectId === null) return true;
        return selectedProjects.includes(t.projectId ?? "");
      });
    }
    return {
      all: base.length,
      active: base.filter((t) => !t.completed && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date())).length,
      completed: base.filter((t) => t.completed).length,
      recurring: base.filter((t) => !t.completed && !!t.hiddenUntil && new Date(t.hiddenUntil) > new Date()).length,
      overdue: base.filter((t) => isOverdue(t)).length,
    };
  }, [sidebarScoped, searchQuery, dateFilter, selectedProjects]);

  // Group overdue tasks by age bucket
  const overdueGroups = useMemo(() => {
    if (statusFilter !== "overdue") return null;
    const week: typeof filteredTasks = [];
    const twoWeeks: typeof filteredTasks = [];
    const month: typeof filteredTasks = [];
    for (const t of filteredTasks) {
      const age = daysOld(t.createdAt);
      if (age >= 30) month.push(t);
      else if (age >= 14) twoWeeks.push(t);
      else week.push(t);
    }
    return [
      { label: "30+ days old", tasks: month },
      { label: "14–30 days old", tasks: twoWeeks },
      { label: "7–14 days old", tasks: week },
    ].filter(g => g.tasks.length > 0);
  }, [statusFilter, filteredTasks]);

  const handleProjectFilterChange = (filter: ProjectFilter) => {
    setProjectFilter(filter);
    setSidebarOpen(false);
  };

  // Keyboard shortcuts
  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "n", action: () => taskInputRef.current?.focus(), description: "New task", category: "Tasks" },
    { key: "c", action: copyTasksToClipboard, description: "Copy tasks", category: "Tasks" },
    { key: "/", action: () => searchInputRef.current?.focus(), description: "Focus search", category: "Navigation" },
    { key: "s", action: () => setSpinOpen(true), description: "Open TaskSpin", category: "Navigation" },
    { key: "m", action: () => setSidebarOpen((v) => !v), description: "Toggle sidebar", category: "Navigation" },
    { key: "1", action: () => setStatusFilter("all"), description: "All tasks", category: "Filters" },
    { key: "2", action: () => setStatusFilter("active"), description: "Active tasks", category: "Filters" },
    { key: "3", action: () => setStatusFilter("overdue"), description: "Overdue tasks", category: "Filters" },
    { key: "4", action: () => setStatusFilter("completed"), description: "Completed tasks", category: "Filters" },
    { key: "f", action: () => (document.querySelector('[aria-label="Toggle filters"]') as HTMLButtonElement)?.click(), description: "Toggle filter panel", category: "Filters" },
    { key: "a", ctrl: true, action: selectAll, description: "Select all", category: "Selection" },
    { key: "Escape", action: () => { if (selectionActive) deselectAll(); }, description: "Deselect all", category: "Selection" },
    { key: "?", action: () => setShortcutsOpen(true), description: "Shortcuts help", category: "Help" },
  ], [copyTasksToClipboard, selectAll, selectionActive, deselectAll]);

  useKeyboardShortcuts(shortcuts, !spinOpen && !shortcutsOpen);

  const taskListProps = {
    projects,
    selectedIds,
    selectionActive,
    onToggleSelect: toggleSelection,
    onToggle: toggleTask,
    onEdit: editTask,
    onEditNotes: editNotes,
    onDelete: deleteTask,
    onAssign: assignToProject,
    onSetRecurrence: setRecurrence,
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSpin={() => setSpinOpen(true)}
        onShortcuts={() => setShortcutsOpen(true)}
        onExport={handleExportForAI}
      />

      <div className="flex-1 flex pt-[72px] min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden sm:block w-64 flex-shrink-0 border-r border-border bg-bg-secondary overflow-y-auto">
          <Sidebar
            projects={projects}
            roadmaps={roadmaps}
            selectedFilter={projectFilter}
            onFilterChange={setProjectFilter}
            onAddProject={addProject}
            onDeleteProject={(id) => setDeleteProjectId(id)}
            onAddRoadmap={addRoadmap}
            onDeleteRoadmap={(id) => setDeleteRoadmapId(id)}
            isAddingProject={isAddingProject}
            isAddingRoadmap={isAddingRoadmap}
            inboxCount={inboxCount}
            allCount={activeTasks.length}
            activeTasks={activeTasks}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="sm:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="sm:hidden fixed top-[72px] left-0 bottom-0 z-40 w-72 bg-bg-secondary border-r border-border"
              >
                <Sidebar
                  projects={projects}
                  roadmaps={roadmaps}
                  selectedFilter={projectFilter}
                  onFilterChange={handleProjectFilterChange}
                  onAddProject={addProject}
                  onDeleteProject={(id) => setDeleteProjectId(id)}
                  onAddRoadmap={addRoadmap}
                  onDeleteRoadmap={(id) => setDeleteRoadmapId(id)}
                  isAddingProject={isAddingProject}
                  isAddingRoadmap={isAddingRoadmap}
                  inboxCount={inboxCount}
                  allCount={activeTasks.length}
                  activeTasks={activeTasks}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="w-[92%] sm:w-[88%] md:w-[85%] lg:w-[82%] max-w-3xl mx-auto py-6 sm:py-8 space-y-6">
            {isRoadmapView && activeRoadmap ? (
              <RoadmapView roadmap={activeRoadmap} />
            ) : (
              <>
                {/* Progress */}
                {sidebarScoped.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <ProgressBar
                      completed={sidebarScoped.filter((t) => t.completed).length}
                      total={sidebarScoped.length}
                    />
                  </motion.div>
                )}

                {/* Add Task Input */}
                <TaskInput
                  onAdd={(title, recurrence) => {
                    const pid = projectFilter !== "all" && projectFilter !== "inbox" ? projectFilter : undefined;
                    addTask(title, pid, recurrence);
                  }}
                  onAddBatch={(titles, projectName, recurrence) => {
                    const pid = !projectName && projectFilter !== "all" && projectFilter !== "inbox" ? projectFilter : undefined;
                    addTasksBatch(titles, projectName, pid, recurrence);
                  }}
                  isLoading={isAdding}
                  inputRef={taskInputRef}
                />

                {/* Search & Filter */}
                <SearchFilter
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  dateFilter={dateFilter}
                  onDateChange={setDateFilter}
                  selectedProjects={selectedProjects}
                  onProjectsChange={setSelectedProjects}
                  projects={projects}
                  counts={statusCounts}
                  searchInputRef={searchInputRef}
                />

                {/* Task List */}
                <div role="region" aria-label="Task results" className={selectionActive ? "pb-20" : ""}>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none" aria-label="Loading tasks">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                      </svg>
                    </div>
                  ) : isError ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-error" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                      </svg>
                      <p className="text-error text-sm">Failed to load tasks</p>
                      <p className="text-text-muted text-xs">Make sure the database is running</p>
                    </div>
                  ) : overdueGroups ? (
                    <div className="space-y-6">
                      {overdueGroups.map((group) => (
                        <div key={group.label}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{group.label}</span>
                            <span className="text-[10px] font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full">{group.tasks.length}</span>
                          </div>
                          <TaskList tasks={group.tasks} {...taskListProps} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <TaskList tasks={filteredTasks} {...taskListProps} />
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Spin Modal */}
      <SpinModal
        isOpen={spinOpen}
        onClose={() => setSpinOpen(false)}
        tasks={tasks}
        projects={projects}
        onComplete={(id) => toggleTask(id, true)}
        currentProjectFilter={projectFilter}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectionActive && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            totalCount={filteredTasks.length}
            projects={projects}
            onDelete={handleBulkDelete}
            onMarkComplete={handleBulkComplete}
            onMarkIncomplete={handleBulkIncomplete}
            onMoveToProject={handleBulkMove}
            onCopy={copyTasksToClipboard}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
          />
        )}
      </AnimatePresence>

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={!!deleteProjectId}
        project={projects.find((p) => p.id === deleteProjectId) ?? null}
        taskCount={tasks.filter((t) => t.projectId === deleteProjectId).length}
        otherProjects={projects.filter((p) => p.id !== deleteProjectId)}
        onConfirm={(action, moveToProjectId) => {
          if (deleteProjectId) removeProject({ id: deleteProjectId, taskAction: action, moveToProjectId });
          setDeleteProjectId(null);
        }}
        onClose={() => setDeleteProjectId(null)}
      />

      {/* Delete Roadmap Modal */}
      <DeleteRoadmapModal
        isOpen={!!deleteRoadmapId}
        roadmap={roadmaps.find((r) => r.id === deleteRoadmapId) ?? null}
        taskCount={tasks.filter((t) => t.roadmapId === deleteRoadmapId).length}
        onConfirm={(action) => {
          if (deleteRoadmapId) {
            removeRoadmap({ id: deleteRoadmapId, taskAction: action });
            if (projectFilter === `roadmap:${deleteRoadmapId}`) setProjectFilter("all");
          }
          setDeleteRoadmapId(null);
        }}
        onClose={() => setDeleteRoadmapId(null)}
      />

      {/* Syncing Overlay */}
      <AnimatePresence>
        {(isMutating || isProjectMutating || isRoadmapMutating) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3 bg-bg-card border border-border rounded-[4px] px-8 py-6 shadow-lg"
            >
              <svg className="animate-spin h-7 w-7 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
              </svg>
              <p className="text-sm text-text-secondary font-medium">Syncing to cloud...</p>
              <p className="text-[11px] text-text-muted">Please wait</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
