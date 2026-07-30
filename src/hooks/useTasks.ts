"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, createTask, createTasksBatch, toggleTask, updateTaskTitle, assignTaskToProject, deleteTask, bulkDeleteTasks, bulkUpdateTasks, setTaskRecurrence } from "@/lib/api";
import { Task } from "@/types/task";
import { showToast } from "@/hooks/useToast";

const TASKS_KEY = ["tasks"];

export function useTasks() {
  const queryClient = useQueryClient();

  const query = useQuery<Task[]>({
    queryKey: TASKS_KEY,
    queryFn: fetchTasks,
  });

  const addMutation = useMutation({
    mutationFn: ({ title, projectId, recurrence }: { title: string; projectId?: string | null; recurrence?: { type: string; days?: number } }) =>
      createTask(title, projectId, recurrence),
    onMutate: async ({ title, projectId, recurrence }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      const optimistic: Task = {
        id: `temp-${Date.now()}`,
        title,
        completed: false,
        projectId: projectId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recurrenceType: recurrence?.type ?? null,
        recurrenceDays: recurrence?.days ?? null,
        recurrenceStartDate: null,
        hiddenUntil: null,
        sourceTaskId: null,
      };
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old ? [optimistic, ...old] : [optimistic]
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to add task", "error");
    },
    onSuccess: () => {
      showToast("Task added", "success");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const batchMutation = useMutation({
    mutationFn: ({ titles, projectName, projectId, recurrence }: { titles: string[]; projectName?: string; projectId?: string | null; recurrence?: { type: string; days?: number } }) =>
      createTasksBatch(titles, projectName, projectId, recurrence),
    onMutate: async ({ titles, projectId, recurrence }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      const optimistic: Task[] = titles.map((title, i) => ({
        id: `temp-${Date.now()}-${i}`,
        title,
        completed: false,
        projectId: projectId ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recurrenceType: recurrence?.type ?? null,
        recurrenceDays: recurrence?.days ?? null,
        recurrenceStartDate: null,
        hiddenUntil: null,
        sourceTaskId: null,
      }));
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old ? [...optimistic, ...old] : optimistic
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to add tasks", "error");
    },
    onSuccess: (_data, { titles, projectName }) => {
      const msg = projectName
        ? `${titles.length} tasks added to "${projectName}"`
        : `${titles.length} tasks added`;
      showToast(msg, "success");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      toggleTask(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) => (t.id === id ? { ...t, completed } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to update task", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const recurrenceMutation = useMutation({
    mutationFn: ({ id, recurrenceType, recurrenceDays, recurrenceStartDate }: { id: string; recurrenceType: string | null; recurrenceDays?: number; recurrenceStartDate?: string | null }) =>
      setTaskRecurrence(id, recurrenceType, recurrenceDays, recurrenceStartDate),
    onMutate: async ({ id, recurrenceType, recurrenceDays, recurrenceStartDate }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, recurrenceType, recurrenceDays: recurrenceDays ?? null, recurrenceStartDate: recurrenceStartDate ?? null }
            : t
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to set recurrence", "error");
    },
    onSuccess: (_data, { recurrenceType }) => {
      showToast(recurrenceType ? "Recurrence set" : "Recurrence removed", "success");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.filter((t) => t.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to delete task", "error");
    },
    onSuccess: () => {
      showToast("Task deleted", "info");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateTaskTitle(id, title),
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) => (t.id === id ? { ...t, title } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to edit task", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string | null }) =>
      assignTaskToProject(id, projectId),
    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) => (t.id === id ? { ...t, projectId } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to move task", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteTasks(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      const idSet = new Set(ids);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.filter((t) => !idSet.has(t.id))
      );
      return { previous };
    },
    onError: (_err, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to delete tasks", "error");
    },
    onSuccess: (_data, ids) => {
      showToast(`${ids.length} tasks deleted`, "info");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: { completed?: boolean; projectId?: string | null } }) =>
      bulkUpdateTasks(ids, data),
    onMutate: async ({ ids, data }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      const idSet = new Set(ids);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) => (idSet.has(t.id) ? { ...t, ...data } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(TASKS_KEY, context.previous);
      }
      showToast("Failed to update tasks", "error");
    },
    onSuccess: (_data, { ids, data }) => {
      if (data.completed !== undefined) {
        showToast(`${ids.length} tasks ${data.completed ? "completed" : "reopened"}`, "success");
      } else if (data.projectId !== undefined) {
        showToast(`${ids.length} tasks moved`, "success");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addTask: (title: string, projectId?: string | null, recurrence?: { type: string; days?: number }) =>
      addMutation.mutate({ title, projectId, recurrence }),
    addTasksBatch: (titles: string[], projectName?: string, projectId?: string | null, recurrence?: { type: string; days?: number }) =>
      batchMutation.mutate({ titles, projectName, projectId, recurrence }),
    isAdding: addMutation.isPending || batchMutation.isPending,
    isMutating:
      addMutation.isPending ||
      batchMutation.isPending ||
      toggleMutation.isPending ||
      editMutation.isPending ||
      assignMutation.isPending ||
      deleteMutation.isPending ||
      bulkDeleteMutation.isPending ||
      bulkUpdateMutation.isPending ||
      recurrenceMutation.isPending,
    toggleTask: (id: string, completed: boolean) =>
      toggleMutation.mutate({ id, completed }),
    editTask: (id: string, title: string) =>
      editMutation.mutate({ id, title }),
    assignToProject: (id: string, projectId: string | null) =>
      assignMutation.mutate({ id, projectId }),
    setRecurrence: (id: string, recurrenceType: string | null, recurrenceDays?: number, recurrenceStartDate?: string | null) =>
      recurrenceMutation.mutate({ id, recurrenceType, recurrenceDays, recurrenceStartDate }),
    deleteTask: deleteMutation.mutate,
    bulkDelete: (ids: string[]) => bulkDeleteMutation.mutate(ids),
    bulkUpdate: (ids: string[], data: { completed?: boolean; projectId?: string | null }) =>
      bulkUpdateMutation.mutate({ ids, data }),
  };
}
