"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, createTask, createTasksBatch, toggleTask, updateTaskTitle, assignTaskToProject, deleteTask } from "@/lib/api";
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
    mutationFn: createTask,
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      const optimistic: Task = {
        id: `temp-${Date.now()}`,
        title,
        completed: false,
        projectId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old ? [optimistic, ...old] : [optimistic]
      );
      return { previous };
    },
    onError: (_err, _title, context) => {
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
    mutationFn: ({ titles, projectName }: { titles: string[]; projectName?: string }) =>
      createTasksBatch(titles, projectName),
    onMutate: async ({ titles }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      const optimistic: Task[] = titles.map((title, i) => ({
        id: `temp-${Date.now()}-${i}`,
        title,
        completed: false,
        projectId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    addTask: addMutation.mutate,
    addTasksBatch: (titles: string[], projectName?: string) =>
      batchMutation.mutate({ titles, projectName }),
    isAdding: addMutation.isPending || batchMutation.isPending,
    toggleTask: (id: string, completed: boolean) =>
      toggleMutation.mutate({ id, completed }),
    editTask: (id: string, title: string) =>
      editMutation.mutate({ id, title }),
    assignToProject: (id: string, projectId: string | null) =>
      assignMutation.mutate({ id, projectId }),
    deleteTask: deleteMutation.mutate,
  };
}
