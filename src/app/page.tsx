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
import { FollowUpModal } from "@/components/FollowUpModal";
import { FollowUpChainModal } from "@/components/FollowUpChainModal";
import { TaskPickerModal } from "@/components/TaskPickerModal";
import { DeleteProjectModal } from "@/components/DeleteProjectModal";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { addFollowUp as addFollowUpApi, moveToChain as moveToChainApi } from "@/lib/api";
import { generateAIExportPrompt, downloadExport } from "@/lib/exportForAI";
import { useKeyboardShortcuts, Shortcut } from "@/hooks/useKeyboardShortcuts";
import { showToast } from "@/hooks/useToast";
import { FilterTab, ProjectFilter } from "@/types/task";
import { buildFollowUpMap, getRootTasks, findRootForTask } from "@/lib/chainUtils";

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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  // Read project from URL query param (from dashboard card click)
  const searchParams = useSearchParams();

  // Sidebar state
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (projectParam) {
      setProjectFilter(projectParam);
    }
  }, [searchParams]);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterTab>("active");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Spin modal state
  const [spinOpen, setSpinOpen] = useState(false);

  // Shortcuts modal state
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Follow-up modal state
  const [followUpTask, setFollowUpTask] = useState<{ id: string; title: string; projectId?: string | null; recurrenceType?: string | null; recurrenceDays?: number | null } | null>(null);

  // Follow-up chain modal state
  const [chainTaskId, setChainTaskId] = useState<string | null>(null);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);

  // Chain expand/collapse state
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());

  // Delete project modal state
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  // Refs for keyboard shortcuts
  const taskInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Data hooks
  const queryClient = useQueryClient();
  const { tasks, isLoading, isError, addTask, addTasksBatch, isAdding, isMutating, toggleTask, editTask, assignToProject, setRecurrence, deleteTask, bulkDelete, bulkUpdate } = useTasks();
  const { projects, addProject, removeProject, isAdding: isAddingProject, isMutating: isProjectMutating } = useProjects();

  // Wrap toggleTask to show follow-up modal on completion
  const handleToggleTask = useCallback((id: string, completed: boolean) => {
    toggleTask(id, completed);
    if (completed) {
      const task = tasks.find(t => t.id === id);
      if (task) {
        setFollowUpTask({ id: task.id, title: task.title, projectId: task.projectId, recurrenceType: task.recurrenceType, recurrenceDays: task.recurrenceDays });
      }
    }
  }, [toggleTask, tasks]);

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

  const tasksWithFollowUps = useMemo(() =>
    new Set(tasks.filter(t => t.sourceTaskId).map(t => t.sourceTaskId!)),
    [tasks]
  );

  // Build follow-up chain map from all tasks
  const followUpMap = useMemo(() => buildFollowUpMap(tasks), [tasks]);

  // Apply all filters (only root tasks appear at top level)
  const filteredTasks = useMemo(() => {
    let result = getRootTasks(tasks);

    // Sidebar project filter (single project quick-select)
    if (projectFilter === "inbox") {
      result = result.filter((t) => t.projectId === null);
    } else if (projectFilter !== "all") {
      result = result.filter((t) => t.projectId === projectFilter);
    }

    // Text search (with bubble-up: include root if any follow-up matches)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        if (t.title.toLowerCase().includes(q)) return true;
        const chain = followUpMap.get(t.id);
        if (chain) return chain.some(fu => fu.title.toLowerCase().includes(q));
        return false;
      });
    }

    // Status filter
    if (statusFilter === "active") result = result.filter((t) => !t.completed && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date()));
    if (statusFilter === "completed") result = result.filter((t) => t.completed);
    if (statusFilter === "recurring") result = result.filter((t) => !t.completed && !!t.hiddenUntil && new Date(t.hiddenUntil) > new Date());

    // Date filter
    if (dateFilter === "today") result = result.filter((t) => isToday(t.createdAt));
    if (dateFilter === "week") result = result.filter((t) => isThisWeek(t.createdAt));
    if (dateFilter === "month") result = result.filter((t) => isThisMonth(t.createdAt));

    // Multi-project filter (from search filter panel)
    if (selectedProjects.length > 0) {
      result = result.filter((t) => {
        if (selectedProjects.includes("inbox") && t.projectId === null) return true;
        return selectedProjects.includes(t.projectId ?? "");
      });
    }

    return result;
  }, [tasks, projectFilter, searchQuery, statusFilter, dateFilter, selectedProjects, followUpMap]);

  // Auto-expand chains when search matches a follow-up
  const effectiveExpandedChains = useMemo(() => {
    if (!searchQuery.trim()) return expandedChains;
    const q = searchQuery.toLowerCase();
    const autoExpand = new Set(expandedChains);
    for (const task of filteredTasks) {
      const chain = followUpMap.get(task.id);
      if (chain && chain.some(fu => fu.title.toLowerCase().includes(q))) {
        autoExpand.add(task.id);
      }
    }
    return autoExpand;
  }, [searchQuery, expandedChains, filteredTasks, followUpMap]);

  const toggleChainExpand = useCallback((id: string) => {
    setExpandedChains(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // All visible task IDs (root + expanded follow-ups)
  const visibleTaskIds = useMemo(() => {
    const ids = new Set(filteredTasks.map(t => t.id));
    for (const task of filteredTasks) {
      if (effectiveExpandedChains.has(task.id)) {
        const chain = followUpMap.get(task.id);
        if (chain) chain.forEach(fu => ids.add(fu.id));
      }
    }
    return ids;
  }, [filteredTasks, effectiveExpandedChains, followUpMap]);

  // Prune stale selections when filter changes
  useEffect(() => {
    setSelectedIds(prev => {
      const pruned = new Set([...prev].filter(id => visibleTaskIds.has(id)));
      return pruned.size === prev.size ? prev : pruned;
    });
  }, [visibleTaskIds]);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(visibleTaskIds));
  }, [visibleTaskIds]);

  // Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    bulkDelete([...selectedIds]);
    deselectAll();
  }, [selectedIds, bulkDelete, deselectAll]);

  const handleBulkComplete = useCallback(() => {
    bulkUpdate([...selectedIds], { completed: true });
    deselectAll();
  }, [selectedIds, bulkUpdate, deselectAll]);

  const handleBulkIncomplete = useCallback(() => {
    bulkUpdate([...selectedIds], { completed: false });
    deselectAll();
  }, [selectedIds, bulkUpdate, deselectAll]);

  const handleBulkMove = useCallback((projectId: string | null) => {
    bulkUpdate([...selectedIds], { projectId });
    deselectAll();
  }, [selectedIds, bulkUpdate, deselectAll]);

  const copyTasksToClipboard = useCallback(() => {
    const selected = selectionActive ? selectedIds : new Set(filteredTasks.map(t => t.id));
    const lines: string[] = [];
    let rootNum = 0;

    for (const rootTask of filteredTasks) {
      if (!selected.has(rootTask.id)) {
        const chain = followUpMap.get(rootTask.id);
        const hasSelectedFollowUp = chain?.some(fu => selected.has(fu.id));
        if (!hasSelectedFollowUp) continue;
      }

      rootNum++;
      if (selected.has(rootTask.id)) {
        lines.push(`${rootNum}. ${rootTask.title}`);
      }

      const chain = followUpMap.get(rootTask.id);
      if (chain) {
        let subNum = 0;
        for (const fu of chain) {
          if (selected.has(fu.id)) {
            subNum++;
            lines.push(`  ${rootNum}.${subNum} ${fu.title}`);
          }
        }
      }
    }

    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${lines.length} tasks copied to clipboard`, "info");
    });
  }, [selectionActive, selectedIds, filteredTasks, followUpMap]);

  const handleExportForAI = useCallback(() => {
    const content = generateAIExportPrompt({ tasks, projects });
    downloadExport(content);
    navigator.clipboard.writeText(content).then(
      () => showToast("Copied to clipboard & downloading file", "success"),
      () => showToast("Downloading file", "success")
    );
  }, [tasks, projects]);

  // Counts for the current sidebar-scoped view (before search/status/date filters)
  const rootTasks = useMemo(() => getRootTasks(tasks), [tasks]);
  const sidebarScoped = useMemo(() => {
    if (projectFilter === "inbox") return rootTasks.filter((t) => t.projectId === null);
    if (projectFilter !== "all") return rootTasks.filter((t) => t.projectId === projectFilter);
    return rootTasks;
  }, [rootTasks, projectFilter]);

  const completedCount = filteredTasks.filter((t) => t.completed).length;
  const activeCount = filteredTasks.filter((t) => !t.completed && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date())).length;
  const activeTasks = rootTasks.filter((t) => !t.completed && !(t.hiddenUntil && new Date(t.hiddenUntil) > new Date()));
  const inboxCount = activeTasks.filter((t) => t.projectId === null).length;

  // Counts for status pills (based on sidebar + search + date + project multi-select, but NOT status)
  const statusCounts = useMemo(() => {
    let base = sidebarScoped;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter((t) => {
        if (t.title.toLowerCase().includes(q)) return true;
        const chain = followUpMap.get(t.id);
        if (chain) return chain.some(fu => fu.title.toLowerCase().includes(q));
        return false;
      });
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
    };
  }, [sidebarScoped, searchQuery, dateFilter, selectedProjects, followUpMap]);

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
    { key: "3", action: () => setStatusFilter("completed"), description: "Completed tasks", category: "Filters" },
    { key: "f", action: () => (document.querySelector('[aria-label="Toggle filters"]') as HTMLButtonElement)?.click(), description: "Toggle filter panel", category: "Filters" },
    { key: "a", ctrl: true, action: selectAll, description: "Select all", category: "Selection" },
    { key: "Escape", action: () => { if (selectionActive) deselectAll(); }, description: "Deselect all", category: "Selection" },
    { key: "?", action: () => setShortcutsOpen(true), description: "Shortcuts help", category: "Help" },
  ], [copyTasksToClipboard, selectAll, selectionActive, deselectAll]);

  useKeyboardShortcuts(shortcuts, !spinOpen && !shortcutsOpen);

  return (
    <>
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
            selectedFilter={projectFilter}
            onFilterChange={setProjectFilter}
            onAddProject={addProject}
            onDeleteProject={(id) => setDeleteProjectId(id)}
            isAddingProject={isAddingProject}
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
                  selectedFilter={projectFilter}
                  onFilterChange={handleProjectFilterChange}
                  onAddProject={addProject}
                  onDeleteProject={(id) => setDeleteProjectId(id)}
                  isAddingProject={isAddingProject}
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
            {/* Progress */}
            {sidebarScoped.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
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
                  <svg
                    className="animate-spin h-8 w-8 text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-label="Loading tasks"
                  >
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
              ) : (
                <TaskList
                  tasks={filteredTasks}
                  projects={projects}
                  selectedIds={selectedIds}
                  selectionActive={selectionActive}
                  tasksWithFollowUps={tasksWithFollowUps}
                  followUpMap={followUpMap}
                  expandedChains={effectiveExpandedChains}
                  onToggleExpand={toggleChainExpand}
                  onToggleSelect={toggleSelection}
                  onToggle={handleToggleTask}
                  onEdit={editTask}
                  onDelete={deleteTask}
                  onAssign={assignToProject}
                  onSetRecurrence={setRecurrence}
                  onOpenFollowUps={setChainTaskId}
                />
              )}
            </div>
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
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Follow-Up Modal (on task completion) */}
      <FollowUpModal
        isOpen={followUpTask !== null}
        completedTaskTitle={followUpTask?.title ?? ""}
        recurrenceInfo={followUpTask?.recurrenceType ? { type: followUpTask.recurrenceType, days: followUpTask.recurrenceDays } : null}
        onAdd={(title) => {
          const pid = followUpTask?.projectId ?? (projectFilter !== "all" && projectFilter !== "inbox" ? projectFilter : undefined);
          addFollowUpApi(followUpTask!.id, title, undefined, pid).then(() => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
          });
          setFollowUpTask(null);
        }}
        onSkip={() => setFollowUpTask(null)}
      />

      {/* Follow-Up Chain Modal */}
      <FollowUpChainModal
        isOpen={chainTaskId !== null}
        onClose={() => setChainTaskId(null)}
        task={chainTaskId ? tasks.find(t => t.id === chainTaskId) ?? null : null}
        onOpenTaskPicker={() => setTaskPickerOpen(true)}
      />

      {/* Task Picker for attaching existing tasks to chain */}
      <TaskPickerModal
        isOpen={taskPickerOpen}
        onClose={() => setTaskPickerOpen(false)}
        excludeTaskIds={chainTaskId ? [chainTaskId] : []}
        contextProjectId={chainTaskId ? tasks.find(t => t.id === chainTaskId)?.projectId : null}
        onSelect={async (taskId) => {
          if (!chainTaskId) return;
          setTaskPickerOpen(false);
          try {
            await moveToChainApi(chainTaskId, taskId);
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "follow-ups" });
            showToast("Task moved to chain", "success");
          } catch {
            showToast("Failed to move task", "error");
          }
        }}
      />

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
          if (deleteProjectId) {
            removeProject({ id: deleteProjectId, taskAction: action, moveToProjectId });
          }
          setDeleteProjectId(null);
        }}
        onClose={() => setDeleteProjectId(null)}
      />

      {/* Syncing Overlay */}
      <AnimatePresence>
        {(isMutating || isProjectMutating) && (
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
    </>
  );
}
