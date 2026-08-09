<?php

use App\Models\Project;
use Inertia\Testing\AssertableInertia as Assert;

function validProjectFormPayload(array $overrides = []): array
{
    return array_merge([
        'client_name' => 'Acme Corporation',
        'project_name' => 'Website Revamp',
        'description' => 'Revamp the marketing site.',
        'status' => 'Planning',
        'priority' => 'Medium',
        'start_date' => '2026-01-01',
        'due_date' => '2026-02-01',
    ], $overrides);
}

test('index renders the projects page with seeded data', function () {
    Project::factory()->count(3)->create();

    $this->get('/projects')->assertInertia(
        fn (Assert $page) => $page
            ->component('projects/index')
            ->has('projects.data', 3)
            ->has('filters')
    );
});

test('index passes search and filter query params through as inertia filters', function () {
    Project::factory()->create(['status' => 'Completed']);

    $this->get('/projects?search=Acme&status=Completed')->assertInertia(
        fn (Assert $page) => $page
            ->component('projects/index')
            ->where('filters.search', 'Acme')
            ->where('filters.status', 'Completed')
    );
});

test('store creates a project and redirects back', function () {
    $response = $this->post('/projects', validProjectFormPayload());

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
    $this->assertDatabaseHas('projects', ['client_name' => 'Acme Corporation']);
});

test('store fails validation for missing required fields', function () {
    $response = $this->post('/projects', []);

    $response->assertSessionHasErrors(['client_name', 'project_name', 'status', 'priority', 'start_date', 'due_date']);
    $this->assertDatabaseCount('projects', 0);
});

test('store fails validation when due date is before start date', function () {
    $response = $this->post('/projects', validProjectFormPayload([
        'start_date' => '2026-05-01',
        'due_date' => '2026-04-01',
    ]));

    $response->assertSessionHasErrors(['due_date']);
});

test('update modifies an existing project and redirects back', function () {
    $project = Project::factory()->create(['project_name' => 'Old Name']);

    $response = $this->put("/projects/{$project->id}", validProjectFormPayload([
        'project_name' => 'New Name',
    ]));

    $response->assertRedirect();
    expect($project->fresh()->project_name)->toBe('New Name');
});

test('destroy deletes a project and redirects back', function () {
    $project = Project::factory()->create();

    $response = $this->delete("/projects/{$project->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});
