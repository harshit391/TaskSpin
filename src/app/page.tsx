"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SearchFilter, DateFilter } from "@/components/SearchFilter";
import { TaskInput } from "@/components/TaskInput";
import { TaskList } from "@/components/TaskList";
import { ProgressBar } from "@/components/ProgressBar";
import { SpinModal } from "@/components/SpinModal";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useKeyboardShortcuts, Shortcut } from "@/hooks/useKeyboardShortcuts";
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
  const [statusFilter, setStatusFilter] = useState<FilterTab>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Spin modal state
  const [spinOpen, setSpinOpen] = useState(false);

  // Shortcuts modal state
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Refs for keyboard shortcuts
  const taskInputRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Data hooks
  const { tasks, isLoading, isError, addTask, addTasksBatch, isAdding, isMutating, toggleTask, editTask, assignToProject, deleteTask } = useTasks();
  const { projects, addProject, removeProject, isAdding: isAddingProject, isMutating: isProjectMutating } = useProjects();

  // Apply all filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Sidebar project filter (single project quick-select)
    if (projectFilter === "inbox") {
      result = result.filter((t) => t.projectId === null);
    } else if (projectFilter !== "all") {
      result = result.filter((t) => t.projectId === projectFilter);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter === "active") result = result.filter((t) => !t.completed);
    if (statusFilter === "completed") result = result.filter((t) => t.completed);

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
  }, [tasks, projectFilter, searchQuery, statusFilter, dateFilter, selectedProjects]);

  // Counts for the current sidebar-scoped view (before search/status/date filters)
  const sidebarScoped = useMemo(() => {
    if (projectFilter === "inbox") return tasks.filter((t) => t.projectId === null);
    if (projectFilter !== "all") return tasks.filter((t) => t.projectId === projectFilter);
    return tasks;
  }, [tasks, projectFilter]);

  const completedCount = filteredTasks.filter((t) => t.completed).length;
  const activeCount = filteredTasks.filter((t) => !t.completed).length;
  const activeTasks = tasks.filter((t) => !t.completed);
  const inboxCount = activeTasks.filter((t) => t.projectId === null).length;

  // Counts for status pills (based on sidebar + search + date + project multi-select, but NOT status)
  const statusCounts = useMemo(() => {
    let base = sidebarScoped;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter((t) => t.title.toLowerCase().includes(q));
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
      active: base.filter((t) => !t.completed).length,
      completed: base.filter((t) => t.completed).length,
    };
  }, [sidebarScoped, searchQuery, dateFilter, selectedProjects]);

  const handleProjectFilterChange = (filter: ProjectFilter) => {
    setProjectFilter(filter);
    setSidebarOpen(false);
  };

  // Keyboard shortcuts
  const shortcuts: Shortcut[] = useMemo(() => [
    { key: "n", action: () => taskInputRef.current?.focus(), description: "New task", category: "Tasks" },
    { key: "/", action: () => searchInputRef.current?.focus(), description: "Focus search", category: "Navigation" },
    { key: "s", action: () => setSpinOpen(true), description: "Open TaskSpin", category: "Navigation" },
    { key: "m", action: () => setSidebarOpen((v) => !v), description: "Toggle sidebar", category: "Navigation" },
    { key: "1", action: () => setStatusFilter("all"), description: "All tasks", category: "Filters" },
    { key: "2", action: () => setStatusFilter("active"), description: "Active tasks", category: "Filters" },
    { key: "3", action: () => setStatusFilter("completed"), description: "Completed tasks", category: "Filters" },
    { key: "f", action: () => (document.querySelector('[aria-label="Toggle filters"]') as HTMLButtonElement)?.click(), description: "Toggle filter panel", category: "Filters" },
    { key: "?", action: () => setShortcutsOpen(true), description: "Shortcuts help", category: "Help" },
  ], []);

  useKeyboardShortcuts(shortcuts, !spinOpen && !shortcutsOpen);

  return (
    <>
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSpin={() => setSpinOpen(true)}
        onShortcuts={() => setShortcutsOpen(true)}
      />

      <div className="flex-1 flex pt-[72px] min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden sm:block w-64 flex-shrink-0 border-r border-border bg-bg-secondary overflow-y-auto">
          <Sidebar
            projects={projects}
            selectedFilter={projectFilter}
            onFilterChange={setProjectFilter}
            onAddProject={addProject}
            onDeleteProject={removeProject}
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
                  onDeleteProject={removeProject}
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
              onAdd={(title) => {
                const pid = projectFilter !== "all" && projectFilter !== "inbox" ? projectFilter : undefined;
                addTask(title, pid);
              }}
              onAddBatch={(titles, projectName) => addTasksBatch(titles, projectName)}
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
            <div role="region" aria-label="Task results">
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
                  onToggle={toggleTask}
                  onEdit={editTask}
                  onDelete={deleteTask}
                  onAssign={assignToProject}
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
