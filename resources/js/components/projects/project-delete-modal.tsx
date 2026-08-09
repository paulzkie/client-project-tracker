import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Project } from './projects-data';

interface ProjectDeleteModalProps {
    project: Project;
    onConfirm: () => void;
    onClose: () => void;
}

export function ProjectDeleteModal({ project, onConfirm, onClose }: ProjectDeleteModalProps) {
    function handleConfirm() {
        onConfirm();
        onClose();
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                </DialogHeader>

                <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete &ldquo;{project.project_name}&rdquo;? This cannot be undone.
                </p>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirm}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
