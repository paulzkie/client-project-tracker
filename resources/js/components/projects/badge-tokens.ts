import type { ProjectPriority, ProjectStatus } from './projects-data';

/**
 * Maps each domain value to Tailwind utilities backed by the status/priority
 * design tokens defined in resources/css/app.css (`@theme`), so the actual
 * colors live in one place instead of being hardcoded per component.
 */
export const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
    Planning: 'border-transparent bg-status-planning text-status-planning-foreground',
    'In Progress': 'border-transparent bg-status-in-progress text-status-in-progress-foreground',
    'On Hold': 'border-transparent bg-status-on-hold text-status-on-hold-foreground',
    Completed: 'border-transparent bg-status-completed text-status-completed-foreground',
};

export const PRIORITY_BADGE_CLASS: Record<ProjectPriority, string> = {
    Low: 'border-transparent bg-priority-low text-priority-low-foreground',
    Medium: 'border-transparent bg-priority-medium text-priority-medium-foreground',
    High: 'border-transparent bg-priority-high text-priority-high-foreground',
};
