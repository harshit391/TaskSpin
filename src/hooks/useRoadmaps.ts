"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRoadmaps, createRoadmap, updateRoadmap, deleteRoadmap } from "@/lib/api";
import { Roadmap } from "@/types/task";
import { showToast } from "@/hooks/useToast";

const ROADMAPS_KEY = ["roadmaps"];

export function useRoadmaps() {
  const queryClient = useQueryClient();

  const query = useQuery<Roadmap[]>({
    queryKey: ROADMAPS_KEY,
    queryFn: fetchRoadmaps,
  });

  const addMutation = useMutation({
    mutationFn: ({ title, color }: { title: string; color: string }) =>
      createRoadmap(title, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROADMAPS_KEY });
      showToast("Roadmap created", "success");
    },
    onError: () => {
      showToast("Failed to create roadmap", "error");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; color?: string } }) =>
      updateRoadmap(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROADMAPS_KEY });
    },
    onError: () => {
      showToast("Failed to update roadmap", "error");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (options: { id: string; taskAction: "delete" | "move_inbox" }) =>
      deleteRoadmap(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROADMAPS_KEY });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      showToast("Roadmap deleted", "info");
    },
    onError: () => {
      showToast("Failed to delete roadmap", "error");
    },
  });

  return {
    roadmaps: query.data ?? [],
    isLoading: query.isLoading,
    addRoadmap: (title: string, color: string) => addMutation.mutate({ title, color }),
    editRoadmap: (id: string, data: { title?: string; color?: string }) =>
      editMutation.mutate({ id, data }),
    removeRoadmap: (options: { id: string; taskAction: "delete" | "move_inbox" }) =>
      removeMutation.mutate(options),
    isAdding: addMutation.isPending,
    isMutating:
      addMutation.isPending ||
      editMutation.isPending ||
      removeMutation.isPending,
  };
}
