"use client";

import { useState, useEffect } from "react";
import { getDefaultPage, setDefaultPage } from "@/app/page";
import { showToast } from "@/hooks/useToast";

interface SetDefaultPageButtonProps {
  page: string;
}

export function SetDefaultPageButton({ page }: SetDefaultPageButtonProps) {
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    setIsDefault(getDefaultPage() === page);
  }, [page]);

  if (isDefault) {
    return (
      <span className="text-[10px] text-accent/70 border border-accent/30 rounded-md px-2 py-1">
        Default
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        setDefaultPage(page);
        setIsDefault(true);
        showToast("Set as default page", "success");
      }}
      className="text-[10px] text-text-muted hover:text-accent border border-border hover:border-accent/30 rounded-md px-2 py-1 transition-colors"
    >
      Set as default
    </button>
  );
}
