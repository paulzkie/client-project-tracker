import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    EMPTY_PROJECT_FORM,
    PROJECT_PRIORITIES,
    PROJECT_STATUSES,
    toProjectFormData,
    validateProjectForm,
    type Project,
    type ProjectFormData,
} from './projects-data';

interface ProjectFormModalProps {
    project: Project | null;
    onSubmit: (data: ProjectFormData) => void;
    onClose: () => void;
}

/**
 * Owns only the form fields and client-side validation. The actual mutation
 * (and its optimistic update / rollback) is owned by the parent via
 * `onSubmit` — this modal closes immediately on valid submit rather than
 * waiting on the network round-trip.
 */
export function ProjectFormModal({ project, onSubmit, onClose }: ProjectFormModalProps) {
    const isEditing = project !== null;
    const [data, setData] = useState<ProjectFormData>(project ? toProjectFormData(project) : EMPTY_PROJECT_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});

    function updateField<K extends keyof ProjectFormData>(field: K, value: ProjectFormData[K]) {
        setData((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        const validationErrors = validateProjectForm(data);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        onSubmit(data);
        onClose();
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Project' : 'New Project'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1.5">
                        <Label htmlFor="client_name">Client Name</Label>
                        <Input
                            id="client_name"
                            value={data.client_name}
                            onChange={(e) => updateField('client_name', e.target.value)}
                            aria-invalid={Boolean(errors.client_name)}
                        />
                        {errors.client_name && <p className="text-xs text-destructive">{errors.client_name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="project_name">Project Name</Label>
                        <Input
                            id="project_name"
                            value={data.project_name}
                            onChange={(e) => updateField('project_name', e.target.value)}
                            aria-invalid={Boolean(errors.project_name)}
                        />
                        {errors.project_name && <p className="text-xs text-destructive">{errors.project_name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={3}
                            value={data.description}
                            onChange={(e) => updateField('description', e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) => updateField('status', value as ProjectFormData['status'])}
                            >
                                <SelectTrigger id="status" aria-invalid={Boolean(errors.status)}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROJECT_STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="priority">Priority</Label>
                            <Select
                                value={data.priority}
                                onValueChange={(value) => updateField('priority', value as ProjectFormData['priority'])}
                            >
                                <SelectTrigger id="priority" aria-invalid={Boolean(errors.priority)}>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROJECT_PRIORITIES.map((priority) => (
                                        <SelectItem key={priority} value={priority}>
                                            {priority}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.priority && <p className="text-xs text-destructive">{errors.priority}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="start_date">Start Date</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => updateField('start_date', e.target.value)}
                                aria-invalid={Boolean(errors.start_date)}
                            />
                            {errors.start_date && <p className="text-xs text-destructive">{errors.start_date}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={data.due_date}
                                onChange={(e) => updateField('due_date', e.target.value)}
                                aria-invalid={Boolean(errors.due_date)}
                            />
                            {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">{isEditing ? 'Save Changes' : 'Create Project'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
