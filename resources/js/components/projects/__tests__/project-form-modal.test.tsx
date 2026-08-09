import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFormModal } from '../project-form-modal';

describe('ProjectFormModal', () => {
    it('shows validation errors and does not submit when required fields are missing', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(<ProjectFormModal project={null} onSubmit={onSubmit} onClose={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: /create project/i }));

        expect(await screen.findByText('Client name is required.')).toBeInTheDocument();
        expect(screen.getByText('Project name is required.')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('rejects a due date earlier than the start date', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(<ProjectFormModal project={null} onSubmit={onSubmit} onClose={vi.fn()} />);

        await user.type(screen.getByLabelText('Client Name'), 'Acme Corp');
        await user.type(screen.getByLabelText('Project Name'), 'Website');
        await user.click(screen.getByLabelText('Status'));
        await user.click(await screen.findByRole('option', { name: 'Planning' }));
        await user.click(screen.getByLabelText('Priority'));
        await user.click(await screen.findByRole('option', { name: 'Low' }));

        await user.type(screen.getByLabelText('Start Date'), '2026-05-01');
        await user.type(screen.getByLabelText('Due Date'), '2026-04-01');

        await user.click(screen.getByRole('button', { name: /create project/i }));

        expect(await screen.findByText('Due date cannot be earlier than the start date.')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits normalized data and closes immediately when the form is valid', async () => {
        const onSubmit = vi.fn();
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(<ProjectFormModal project={null} onSubmit={onSubmit} onClose={onClose} />);

        await user.type(screen.getByLabelText('Client Name'), 'Acme Corp');
        await user.type(screen.getByLabelText('Project Name'), 'Website');
        await user.click(screen.getByLabelText('Status'));
        await user.click(await screen.findByRole('option', { name: 'Planning' }));
        await user.click(screen.getByLabelText('Priority'));
        await user.click(await screen.findByRole('option', { name: 'Low' }));
        await user.type(screen.getByLabelText('Start Date'), '2026-05-01');
        await user.type(screen.getByLabelText('Due Date'), '2026-06-01');

        await user.click(screen.getByRole('button', { name: /create project/i }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                client_name: 'Acme Corp',
                project_name: 'Website',
                status: 'Planning',
                priority: 'Low',
                start_date: '2026-05-01',
                due_date: '2026-06-01',
            }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('pre-fills fields from an existing project when editing', () => {
        const existing = {
            id: 5,
            client_name: 'Existing Client',
            project_name: 'Existing Project',
            description: 'Some description',
            status: 'Planning' as const,
            priority: 'Medium' as const,
            start_date: '2026-01-01',
            due_date: '2026-02-01',
            created_at: '2026-01-01T00:00:00.000000Z',
            updated_at: '2026-01-01T00:00:00.000000Z',
        };

        render(<ProjectFormModal project={existing} onSubmit={vi.fn()} onClose={vi.fn()} />);

        expect(screen.getByRole('heading', { name: 'Edit Project' })).toBeInTheDocument();
        expect(screen.getByLabelText('Client Name')).toHaveValue('Existing Client');
        expect(screen.getByLabelText('Project Name')).toHaveValue('Existing Project');
    });
});
