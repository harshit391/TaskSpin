"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { HomeDashboard } from "@/components/HomeDashboard";

const DEFAULT_PAGE_KEY = "taskspin-default-page";

export function getDefaultPage(): string {
  if (typeof window === "undefined") return "/dashboard";
  return localStorage.getItem(DEFAULT_PAGE_KEY) || "/";
}

export function setDefaultPage(page: string): void {
  localStorage.setItem(DEFAULT_PAGE_KEY, page);
}

const FEATURES = [
  {
    title: "Smart Tasks",
    description: "Create, organize, and batch-manage tasks with projects, follow-up chains, and recurring schedules.",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M9 12h6M9 16h4",
  },
  {
    title: "Habit Tracker",
    description: "Build streaks, hit milestones, and form lasting habits with daily check-ins and progress visualization.",
    icon: "M12 2c1 3 3.5 5 6 5-1 4-3 8-6 11-3-3-5-7-6-11 2.5 0 5-2 6-5z",
  },
  {
    title: "Projects",
    description: "Group tasks into color-coded projects. Track progress, move tasks between projects, and stay focused.",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  },
  {
    title: "Analytics",
    description: "Track your productivity with daily stats, completion trends, and project breakdowns over time.",
    icon: "M3 3v18h18M7 16l4-4 4 4 5-5",
  },
];

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg-primary flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
          <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (user) {
    return <HomeDashboard />;
  }

  return (
    <div className="min-h-dvh bg-bg-primary flex flex-col overflow-y-auto">
      {/* Nav */}
      <nav className="w-full border-b border-border/50">
        <div className="w-[92%] sm:w-[88%] lg:w-[82%] max-w-5xl mx-auto flex items-center justify-between h-14">
          <span className="text-lg font-display font-bold text-text-primary">TaskSpin</span>
          <Link
            href="/auth"
            className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary leading-tight">
            Your tasks, organized.<br />
            <span className="text-accent">Habits built. Goals hit.</span>
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-lg mx-auto">
            A focused productivity app with smart task management, habit tracking, and analytics — all in one clean interface.
          </p>
          <div className="pt-2">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm sm:text-base font-medium rounded-lg hover:bg-accent/90 transition-all"
            >
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-[92%] sm:w-[88%] lg:w-[82%] max-w-5xl mx-auto pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-5 sm:p-6 rounded-xl border border-border bg-bg-card hover:border-accent/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-1">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border/50 py-12">
        <div className="text-center space-y-4">
          <p className="text-sm text-text-muted">Free to use. No credit card required.</p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-accent text-accent text-sm font-medium rounded-lg hover:bg-accent/5 transition-all"
          >
            Start Organizing
          </Link>
        </div>
      </section>
    </div>
  );
}
