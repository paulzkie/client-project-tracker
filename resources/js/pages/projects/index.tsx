import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ProjectsContent } from '@/components/projects/projects-content';
import type { PaginatedResponse, Project, ProjectFilters } from '@/components/projects/projects-data';

interface ProjectsIndexProps {
    projects: PaginatedResponse<Project>;
    filters: ProjectFilters;
}

export default function ProjectsIndex({ projects, filters }: ProjectsIndexProps) {
    return (
        <AppLayout>
            <Head title="Projects" />
            <ProjectsContent projects={projects} filters={filters} />
        </AppLayout>
    );
}
