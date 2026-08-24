"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRoadmapTasks, addTaskToRoadmap, removeTaskFromRoadmap, reorderRoadmapTasks } from "@/lib/api";
import { Task } from "@/types/task";
import { showToast } from "@/hooks/useToast";

export function useRoadmapTasks(roadmapId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["roadmap-tasks", roadmapId];

  const query = useQuery<Task[]>({
    queryKey,
    queryFn: () => fetchRoadmapTasks(roadmapId!),
    enabled: !!roadmapId,
  });

  const addMutation = useMutation({
    mutationFn: (data: { taskId?: string; title?: string; position?: number }) =>
      addTaskToRoadmap(roadmapId!, data),
    onSuccess: (tasks) => {
      queryClient.setQueryData(queryKey, tasks);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
    onError: () => {
      showToast("Failed to add task", "error");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (taskId: string) => removeTaskFromRoadmap(roadmapId!, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      showToast("Task removed from roadmap", "info");
    },
    onError: () => {
      showToast("Failed to remove task", "error");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderRoadmapTasks(roadmapId!, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      if (previous) {
        const reordered = orderedIds
          .map(id => previous.find(t => t.id === id))
          .filter(Boolean) as Task[];
        queryClient.setQueryData(queryKey, reordered);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      showToast("Failed to reorder", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    addTask: (data: { taskId?: string; title?: string; position?: number }) => addMutation.mutate(data),
    removeTask: (taskId: string) => removeMutation.mutate(taskId),
    reorder: (orderedIds: string[]) => reorderMutation.mutate(orderedIds),
    isMutating: addMutation.isPending || removeMutation.isPending || reorderMutation.isPending,
  };
}
