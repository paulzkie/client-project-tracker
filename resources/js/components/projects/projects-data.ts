export const PROJECT_STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed'] as const;
export const PROJECT_PRIORITIES = ['Low', 'Medium', 'High'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export interface Project {
    id: number;
    client_name: string;
    project_name: string;
    description: string | null;
    status: ProjectStatus;
    priority: ProjectPriority;
    start_date: string;
    due_date: string;
    created_at: string;
    updated_at: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface ProjectFilters {
    search?: string;
    status?: ProjectStatus | '';
    priority?: ProjectPriority | '';
    sort_by?: 'client_name' | 'project_name' | 'status' | 'priority' | 'start_date' | 'due_date' | 'created_at';
    sort_dir?: 'asc' | 'desc';
}

export interface ProjectFormData {
    client_name: string;
    project_name: string;
    description: string;
    status: ProjectStatus | '';
    priority: ProjectPriority | '';
    start_date: string;
    due_date: string;
}

export const EMPTY_PROJECT_FORM: ProjectFormData = {
    client_name: '',
    project_name: '',
    description: '',
    status: '',
    priority: '',
    start_date: '',
    due_date: '',
};

export function toProjectFormData(project: Project): ProjectFormData {
    return {
        client_name: project.client_name,
        project_name: project.project_name,
        description: project.description ?? '',
        status: project.status,
        priority: project.priority,
        start_date: project.start_date,
        due_date: project.due_date,
    };
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormData, string>>;

export function validateProjectForm(input: ProjectFormData): ProjectFormErrors {
    const errors: ProjectFormErrors = {};

    if (!input.client_name.trim()) errors.client_name = 'Client name is required.';
    if (!input.project_name.trim()) errors.project_name = 'Project name is required.';

    if (!input.status) {
        errors.status = 'Status is required.';
    } else if (!PROJECT_STATUSES.includes(input.status)) {
        errors.status = 'Status must be one of: ' + PROJECT_STATUSES.join(', ') + '.';
    }

    if (!input.priority) {
        errors.priority = 'Priority is required.';
    } else if (!PROJECT_PRIORITIES.includes(input.priority)) {
        errors.priority = 'Priority must be one of: ' + PROJECT_PRIORITIES.join(', ') + '.';
    }

    if (!input.start_date) errors.start_date = 'Start date is required.';
    if (!input.due_date) errors.due_date = 'Due date is required.';

    if (input.start_date && input.due_date && input.due_date < input.start_date) {
        errors.due_date = 'Due date cannot be earlier than the start date.';
    }

    return errors;
}
