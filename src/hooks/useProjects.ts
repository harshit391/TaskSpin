"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjects, createProject, updateProject, deleteProject } from "@/lib/api";
import { Project } from "@/types/task";
import { showToast } from "@/hooks/useToast";

const PROJECTS_KEY = ["projects"];

export function useProjects() {
  const queryClient = useQueryClient();

  const query = useQuery<Project[]>({
    queryKey: PROJECTS_KEY,
    queryFn: fetchProjects,
  });

  const addMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      createProject(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      showToast("Project created", "success");
    },
    onError: () => {
      showToast("Failed to create project", "error");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) =>
      updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: () => {
      showToast("Failed to update project", "error");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (options: { id: string; taskAction: "delete" | "move_inbox" | "move_project"; moveToProjectId?: string }) =>
      deleteProject(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      showToast("Project deleted", "info");
    },
    onError: () => {
      showToast("Failed to delete project", "error");
    },
  });

  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    addProject: (name: string, color: string) => addMutation.mutate({ name, color }),
    editProject: (id: string, data: { name?: string; color?: string }) =>
      editMutation.mutate({ id, data }),
    removeProject: (options: { id: string; taskAction: "delete" | "move_inbox" | "move_project"; moveToProjectId?: string }) =>
      removeMutation.mutate(options),
    isAdding: addMutation.isPending,
    isMutating:
      addMutation.isPending ||
      editMutation.isPending ||
      removeMutation.isPending,
  };
}
