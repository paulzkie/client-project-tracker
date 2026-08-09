import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    PROJECT_PRIORITIES,
    PROJECT_STATUSES,
    type PaginatedResponse,
    type Project,
    type ProjectFilters,
    type ProjectFormData,
} from './projects-data';
import { PRIORITY_BADGE_CLASS, STATUS_BADGE_CLASS } from './badge-tokens';
import { ProjectFormModal } from './project-form-modal';
import { ProjectDeleteModal } from './project-delete-modal';

const SORT_OPTIONS: { value: NonNullable<ProjectFilters['sort_by']>; label: string }[] = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'client_name', label: 'Client Name' },
    { value: 'project_name', label: 'Project Name' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'start_date', label: 'Start Date' },
    { value: 'due_date', label: 'Due Date' },
];

function formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

// ProjectFormData's fields are all plain strings, but the interface has no
// index signature, so it isn't structurally assignable to Inertia's
// RequestPayload type without this narrow, explicit conversion.
function toRequestPayload(data: ProjectFormData): Record<string, string> {
    return { ...data };
}

function applyFormData(project: Project, data: ProjectFormData): Project {
    return {
        ...project,
        client_name: data.client_name,
        project_name: data.project_name,
        description: data.description || null,
        status: data.status as Project['status'],
        priority: data.priority as Project['priority'],
        start_date: data.start_date,
        due_date: data.due_date,
        updated_at: new Date().toISOString(),
    };
}

interface ProjectsContentProps {
    projects: PaginatedResponse<Project>;
    filters: ProjectFilters;
}

const ALL_VALUE = '__all__';

export function ProjectsContent({ projects, filters }: ProjectsContentProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [localProjects, setLocalProjects] = useState<Project[]>(projects.data);
    // Tracks the last `projects.data` reference we've synced `localProjects`
    // from. Comparing during render (rather than in a useEffect) lets React
    // apply the reset in the same pass instead of committing a stale render
    // first — see https://react.dev/learn/you-might-not-need-an-effect.
    const [syncedProjectsData, setSyncedProjectsData] = useState(projects.data);
    const [modal, setModal] = useState<
        { type: 'create' } | { type: 'edit'; project: Project } | { type: 'delete'; project: Project } | null
    >(null);
    const isFirstRender = useRef(true);

    if (projects.data !== syncedProjectsData) {
        setSyncedProjectsData(projects.data);
        setLocalProjects(projects.data);
    }

    function applyFilters(next: Partial<ProjectFilters>) {
        router.get(
            ProjectController.index.url(),
            { ...filters, search, ...next },
            { preserveState: true, preserveScroll: true, only: ['projects', 'filters'] },
        );
    }

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                ProjectController.index.url(),
                { ...filters, search },
                { preserveState: true, preserveScroll: true, only: ['projects', 'filters'] },
            );
        }, 300);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function handleCreateSubmit(data: ProjectFormData) {
        const snapshot = localProjects;
        const optimisticProject: Project = applyFormData(
            {
                id: -Date.now(),
                client_name: '',
                project_name: '',
                description: null,
                status: 'Planning',
                priority: 'Low',
                start_date: '',
                due_date: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            data,
        );

        setLocalProjects([optimisticProject, ...snapshot]);

        router.post(ProjectController.store.url(), toRequestPayload(data), {
            preserveScroll: true,
            onSuccess: () => toast.success('Project created.'),
            onError: () => {
                setLocalProjects(snapshot);
                toast.error('Failed to create the project. Please try again.');
            },
        });
    }

    function handleEditSubmit(project: Project, data: ProjectFormData) {
        const snapshot = localProjects;

        setLocalProjects((prev) => prev.map((p) => (p.id === project.id ? applyFormData(p, data) : p)));

        router.put(ProjectController.update.url({ project: project.id }), toRequestPayload(data), {
            preserveScroll: true,
            onSuccess: () => toast.success('Project updated.'),
            onError: () => {
                setLocalProjects(snapshot);
                toast.error('Failed to update the project. Please try again.');
            },
        });
    }

    function handleDeleteConfirm(project: Project) {
        const snapshot = localProjects;

        setLocalProjects((prev) => prev.filter((p) => p.id !== project.id));

        router.delete(ProjectController.destroy.url({ project: project.id }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Project deleted.'),
            onError: () => {
                setLocalProjects(snapshot);
                toast.error('Failed to delete the project. Please try again.');
            },
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    type="search"
                    placeholder="Search by client, project, or description…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs flex-1"
                    aria-label="Search projects"
                />

                <Select
                    value={filters.status || ALL_VALUE}
                    onValueChange={(value) =>
                        applyFilters({ status: value === ALL_VALUE ? '' : (value as ProjectFilters['status']) })
                    }
                >
                    <SelectTrigger className="w-40" aria-label="Filter by status">
                        <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
                        {PROJECT_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.priority || ALL_VALUE}
                    onValueChange={(value) =>
                        applyFilters({ priority: value === ALL_VALUE ? '' : (value as ProjectFilters['priority']) })
                    }
                >
                    <SelectTrigger className="w-40" aria-label="Filter by priority">
                        <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_VALUE}>All priorities</SelectItem>
                        {PROJECT_PRIORITIES.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                                {priority}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.sort_by ?? 'created_at'}
                    onValueChange={(value) => applyFilters({ sort_by: value as ProjectFilters['sort_by'] })}
                >
                    <SelectTrigger className="w-44" aria-label="Sort by">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                Sort: {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Toggle sort direction"
                    title="Toggle sort direction"
                    onClick={() => applyFilters({ sort_dir: filters.sort_dir === 'desc' ? 'asc' : 'desc' })}
                >
                    {filters.sort_dir === 'desc' ? '↓' : '↑'}
                </Button>

                <Button type="button" className="ml-auto" onClick={() => setModal({ type: 'create' })}>
                    + New Project
                </Button>
            </div>

            {localProjects.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No projects match your filters.</p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Project</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Priority</th>
                                <th className="px-4 py-3">Start Date</th>
                                <th className="px-4 py-3">Due Date</th>
                                <th className="px-4 py-3" aria-label="Actions" />
                            </tr>
                        </thead>
                        <tbody>
                            {localProjects.map((project) => {
                                // Optimistically-created rows carry a negative placeholder id until
                                // the real create round-trip reconciles it with the server's id.
                                // Editing/deleting before that would target a nonexistent id, so
                                // actions stay disabled and the row is visibly "pending" until then.
                                const isPending = project.id < 0;

                                return (
                                    <tr
                                        key={project.id}
                                        className={`border-b border-border last:border-b-0 ${isPending ? 'opacity-60' : ''}`}
                                    >
                                        <td className="px-4 py-3">{project.client_name}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex max-w-xs flex-col gap-0.5">
                                                <span className="font-medium text-foreground">
                                                    {project.project_name}
                                                    {isPending && (
                                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                            Saving…
                                                        </span>
                                                    )}
                                                </span>
                                                {project.description && (
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {project.description}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={STATUS_BADGE_CLASS[project.status]}>
                                                {project.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={PRIORITY_BADGE_CLASS[project.priority]}>
                                                {project.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">{formatDate(project.start_date)}</td>
                                        <td className="px-4 py-3">{formatDate(project.due_date)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2 whitespace-nowrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isPending}
                                                    onClick={() => setModal({ type: 'edit', project })}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={isPending}
                                                    onClick={() => setModal({ type: 'delete', project })}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination
                links={projects.links}
                currentPage={projects.current_page}
                lastPage={projects.last_page}
                total={projects.total}
                perPage={projects.per_page}
                onNavigate={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
            />

            {modal?.type === 'create' && (
                <ProjectFormModal project={null} onSubmit={handleCreateSubmit} onClose={() => setModal(null)} />
            )}

            {modal?.type === 'edit' && (
                <ProjectFormModal
                    project={modal.project}
                    onSubmit={(data) => handleEditSubmit(modal.project, data)}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.type === 'delete' && (
                <ProjectDeleteModal
                    project={modal.project}
                    onConfirm={() => handleDeleteConfirm(modal.project)}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
}
