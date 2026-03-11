<p align="center">
  <img src="public/logo.png" alt="TaskSpin Logo" width="80" height="80">
</p>

<h1 align="center">TaskSpin</h1>

<p align="center">
A modern web-based task scheduling application that eliminates decision fatigue by intelligently distributing tasks across your week using randomization.
</p>

**Add your tasks once, set their frequency, and let TaskSpin randomly distribute them across your week. No more deciding what to do when.**

## Features

### Task Management
- Create tasks with name, description, and frequency
- Frequency options: Daily (7x/week), Once, Twice, Thrice (3x/week), or Custom (1-7x/week)
- Edit and delete tasks with inline editing
- Visual frequency badges and task counts

### Intelligent Scheduling
- Randomized task distribution using Fisher-Yates shuffle algorithm
- Daily tasks are always scheduled regardless of capacity (mandatory tasks)
- Capacity limits only apply to non-daily (randomized) tasks
- Spreads task occurrences across different days to avoid clustering
- Automatic schedule regeneration when a new week begins
- Manual "Re-Spin" to generate fresh randomized schedules

### Task Pools
- Break down large goals into ordered subtask roadmaps
- One subtask active at a time, automatically injected into weekly schedule
- Sequential progression through pool subtasks
- JSON import/export for pools

### Side Tasks
- Separate list for ad-hoc or urgent one-off tasks
- Optional due dates with overdue tracking
- Independent from the weekly schedule

### Task Completion
- Mark tasks complete with a single click
- **Early completion**: For non-daily tasks, completing early removes future occurrences for the week
- Progress tracking with visual progress bars (daily and weekly)
- Completion history preservation

### Progressive Web App (PWA)
- Installable on mobile and desktop (Add to Home Screen / browser install)
- Offline support via service worker caching
- Standalone app experience without browser chrome
- Automatic cache updates on new versions

### Customizable Settings
- **Daily Capacity**: Set limits (0-20) for randomized tasks per day (daily tasks are excluded)
- **Week Start Day**: Choose any day (Monday-Sunday) as your week start
- Visual capacity distribution chart
- One-click reset to defaults

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **UI**: React 19, Tailwind CSS 4, Framer Motion
- **State Management**: Zustand
- **Database**: Dexie (IndexedDB wrapper for local persistence)
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites
- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd taskspin

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
/taskspin
├── /app
│   ├── /components          # React UI components
│   │   ├── /layout          # Header, TabNavigation
│   │   ├── /tasks           # TaskList, TaskForm, TaskCard, TaskEditModal
│   │   ├── /schedule        # WeeklySchedule, DayColumn, ScheduledTaskItem, AllTasksView
│   │   ├── /pools           # PoolList, PoolCard, PoolForm, PoolDetailModal
│   │   ├── /sidetasks       # SideTaskList
│   │   └── /settings        # SettingsPanel, CapacityConfig, WeekConfig, DataManagement
│   ├── /database            # Dexie database setup
│   ├── /hooks               # Custom React hooks
│   ├── /services            # Core scheduling algorithm
│   ├── /store               # Zustand state stores
│   ├── /types               # TypeScript definitions
│   ├── page.tsx             # Main page
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles & design system
├── /public
│   ├── manifest.json        # PWA web app manifest
│   ├── sw.js                # Service worker for offline support
│   └── ...                  # Icons and static assets
└── package.json
```

## Architecture

### State Management

Five Zustand stores manage application state:

- **taskStore**: Task CRUD operations with database persistence
- **settingsStore**: User preferences (capacity limits, week configuration)
- **scheduleStore**: Weekly schedule generation, completion tracking, auto-regeneration
- **poolStore**: Task pool management with sequential subtask progression
- **sideTaskStore**: Ad-hoc side task management with due date tracking

### Data Persistence

All data is stored locally in the browser using IndexedDB via Dexie:

- **tasks**: User-created recurring tasks
- **settings**: Capacity and week configuration
- **schedules**: Generated weekly schedules (keeps last 4 weeks)
- **pools**: Task pools with ordered subtasks
- **sideTasks**: Ad-hoc tasks with optional due dates

### Scheduling Algorithm

1. Daily tasks are placed on all 7 days (independent of capacity)
2. Capacity is used exclusively for non-daily tasks
3. Non-daily tasks are shuffled randomly
4. Active pool subtasks are injected as one-time entries
5. Tasks are distributed across eligible days, preferring variety
6. Conflict avoidance spreads same-task occurrences across different days

## Design System

Premium dark UI theme:
- **Background**: Pure black to dark gray gradients
- **Accent**: Vibrant pink (#FF2D6F)
- **Typography**: Oswald (headings) + Inter (body)
- **Animations**: Smooth Framer Motion transitions

## Configuration

Default capacity settings (for non-daily tasks only):
- Monday-Friday: 5 randomized tasks/day
- Saturday-Sunday: 3 randomized tasks/day
- Default week start: Monday

Daily tasks are always scheduled on all 7 days regardless of these limits. All settings can be customized in the Settings tab.

## Browser Support

Works in all modern browsers with IndexedDB and service worker support:
- Chrome, Firefox, Safari, Edge (latest versions)
- Installable as a PWA on Android, iOS, and desktop

## License

[Add your license here]
