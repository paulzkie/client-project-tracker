import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectsContent } from '../projects-content';
import type { PaginatedResponse, Project } from '../projects-data';

const routerGet = vi.fn();
const routerPost = vi.fn();
const routerPut = vi.fn();
const routerDelete = vi.fn();

vi.mock('@inertiajs/react', () => ({
    router: {
        get: (...args: unknown[]) => routerGet(...args),
        post: (...args: unknown[]) => routerPost(...args),
        put: (...args: unknown[]) => routerPut(...args),
        delete: (...args: unknown[]) => routerDelete(...args),
    },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

const project: Project = {
    id: 1,
    client_name: 'Acme Corporation',
    project_name: 'Corporate Website Redesign',
    description: 'Redesign the corporate site.',
    status: 'In Progress',
    priority: 'High',
    start_date: '2026-06-01',
    due_date: '2026-07-15',
    created_at: '2026-06-01T00:00:00.000000Z',
    updated_at: '2026-06-01T00:00:00.000000Z',
};

function paginated(data: Project[]): PaginatedResponse<Project> {
    return { data, current_page: 1, last_page: 1, per_page: 15, total: data.length, links: [] };
}

describe('ProjectsContent', () => {
    beforeEach(() => {
        routerGet.mockClear();
        routerPost.mockClear();
        routerPut.mockClear();
        routerDelete.mockClear();
        toastSuccess.mockClear();
        toastError.mockClear();
    });

    it('shows an empty state when there are no projects', () => {
        render(<ProjectsContent projects={paginated([])} filters={{}} />);

        expect(screen.getByText('No projects match your filters.')).toBeInTheDocument();
    });

    it('renders a row per project with client, status, and priority', () => {
        render(<ProjectsContent projects={paginated([project])} filters={{}} />);

        expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
        expect(screen.getByText('Corporate Website Redesign')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('opens the edit modal when Edit is clicked', async () => {
        const user = userEvent.setup();
        render(<ProjectsContent projects={paginated([project])} filters={{}} />);

        await user.click(screen.getByRole('button', { name: 'Edit' }));

        expect(screen.getByRole('heading', { name: 'Edit Project' })).toBeInTheDocument();
    });

    it('opens the delete confirmation when Delete is clicked', async () => {
        const user = userEvent.setup();
        render(<ProjectsContent projects={paginated([project])} filters={{}} />);

        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
    });

    it('optimistically removes the row on delete confirm, before any response arrives', async () => {
        const user = userEvent.setup();
        render(<ProjectsContent projects={paginated([project])} filters={{}} />);

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(screen.queryByText('Corporate Website Redesign')).not.toBeInTheDocument();
        expect(routerDelete).toHaveBeenCalledTimes(1);
        expect(routerDelete.mock.calls[0][0]).toContain('/projects/1');
    });

    it('shows a success toast once the delete round-trip confirms', async () => {
        routerDelete.mockImplementation((_url: string, options: { onSuccess?: () => void }) => {
            options.onSuccess?.();
        });
        const user = userEvent.setup();
        render(<ProjectsContent projects={paginated([project])} filters={{}} />);

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(toastSuccess).toHaveBeenCalledWith('Project deleted.');
    });

    it('rolls back the row and shows an error toast if the delete request fails', async () => {
        routerDelete.mockImplementation((_url: string, options: { onError?: () => void }) => {
            options.onError?.();
        });
        const user = userEvent.setup();
        render(<ProjectsContent projects={paginated([project])} filters={{}} />);

        await user.click(screen.getByRole('button', { name: 'Delete' }));
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(screen.getByText('Corporate Website Redesign')).toBeInTheDocument());
        expect(toastError).toHaveBeenCalledWith('Failed to delete the project. Please try again.');
    });

    it('optimistically adds the new project to the table on create, before any response arrives, and toasts on success', async () => {
        routerPost.mockImplementation((_url: string, _data: unknown, options: { onSuccess?: () => void }) => {
            options.onSuccess?.();
        });
        const user = userEvent.setup();
        render(<ProjectsContent projects={paginated([project])} filters={{}} />);

        await user.click(screen.getByRole('button', { name: '+ New Project' }));
        await user.type(screen.getByLabelText('Client Name'), 'New Client');
        await user.type(screen.getByLabelText('Project Name'), 'New Project');
        await user.click(screen.getByLabelText('Status'));
        await user.click(await screen.findByRole('option', { name: 'Planning' }));
        await user.click(screen.getByLabelText('Priority'));
        await user.click(await screen.findByRole('option', { name: 'Low' }));
        await user.type(screen.getByLabelText('Start Date'), '2026-05-01');
        await user.type(screen.getByLabelText('Due Date'), '2026-06-01');
        await user.click(screen.getByRole('button', { name: 'Create Project' }));

        expect(screen.getByText('New Client')).toBeInTheDocument();
        expect(routerPost).toHaveBeenCalledTimes(1);
        expect(toastSuccess).toHaveBeenCalledWith('Project created.');
    });
});
