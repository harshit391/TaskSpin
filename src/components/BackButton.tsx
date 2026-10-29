"use client";

interface BackButtonProps {
  /** Where to go when there is no in-app page to return to (e.g. opened directly or as default page). */
  fallback?: string;
  className?: string;
  size?: number;
}

function hasInAppHistory(): boolean {
  if (typeof window === "undefined" || window.history.length <= 1) return false;
  try {
    return !!document.referrer && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

export function BackButton({
  fallback = "/",
  className = "text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[2px] min-w-[44px] min-h-[44px] inline-flex items-center justify-center",
  size = 20,
}: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (hasInAppHistory()) window.history.back();
        else window.location.assign(fallback);
      }}
      className={className}
      aria-label="Go back"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
