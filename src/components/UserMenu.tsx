"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const avatar = user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 min-w-[44px] min-h-[44px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="User menu"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-full border border-border"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-border flex items-center justify-center text-xs font-medium text-accent">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-bg-secondary border border-border rounded-lg shadow-xl overflow-hidden z-[100]">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-text-primary truncate">
              {displayName}
            </p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-bg-tertiary transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
