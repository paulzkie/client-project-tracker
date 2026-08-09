<?php

use App\Models\Project;

function validProjectPayload(array $overrides = []): array
{
    return array_merge([
        'clientName' => 'Acme Corporation',
        'projectName' => 'Website Revamp',
        'description' => 'Revamp the marketing site.',
        'status' => 'Planning',
        'priority' => 'Medium',
        'startDate' => '2026-01-01',
        'dueDate' => '2026-02-01',
    ], $overrides);
}

test('index lists all projects with camelCase fields', function () {
    Project::factory()->count(3)->create();

    $response = $this->getJson('/api/projects');

    $response->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [
                ['id', 'clientName', 'projectName', 'description', 'status', 'priority', 'startDate', 'dueDate'],
            ],
        ]);
});

test('index filters by status and priority', function () {
    Project::factory()->create(['status' => 'Completed', 'priority' => 'High']);
    Project::factory()->create(['status' => 'Planning', 'priority' => 'Low']);

    $response = $this->getJson('/api/projects?status=Completed&priority=High');

    $response->assertOk()->assertJsonCount(1, 'data');
    expect($response->json('data.0.status'))->toBe('Completed');
});

test('index searches by client, project name, and description', function () {
    Project::factory()->create(['client_name' => 'Bright Realty']);
    Project::factory()->create(['client_name' => 'Other Client']);

    $response = $this->getJson('/api/projects?search=Bright');

    $response->assertOk()->assertJsonCount(1, 'data');
    expect($response->json('data.0.clientName'))->toBe('Bright Realty');
});

test('show returns a single project', function () {
    $project = Project::factory()->create();

    $this->getJson("/api/projects/{$project->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $project->id);
});

test('show returns 404 for a missing project', function () {
    $this->getJson('/api/projects/999')->assertNotFound();
});

test('store creates a project from camelCase input', function () {
    $response = $this->postJson('/api/projects', validProjectPayload());

    $response->assertCreated()
        ->assertJsonPath('data.clientName', 'Acme Corporation')
        ->assertJsonPath('data.status', 'Planning');

    $this->assertDatabaseHas('projects', [
        'client_name' => 'Acme Corporation',
        'status' => 'Planning',
    ]);
});

test('store rejects missing required fields', function () {
    $response = $this->postJson('/api/projects', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['client_name', 'project_name', 'status', 'priority', 'start_date', 'due_date']);
});

test('store rejects an invalid status or priority', function () {
    $response = $this->postJson('/api/projects', validProjectPayload([
        'status' => 'Bogus',
        'priority' => 'Extreme',
    ]));

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['status', 'priority']);
});

test('store rejects a due date earlier than the start date', function () {
    $response = $this->postJson('/api/projects', validProjectPayload([
        'startDate' => '2026-05-01',
        'dueDate' => '2026-04-01',
    ]));

    $response->assertUnprocessable()->assertJsonValidationErrors(['due_date']);
});

test('update modifies an existing project', function () {
    $project = Project::factory()->create(['project_name' => 'Old Name']);

    $response = $this->putJson("/api/projects/{$project->id}", validProjectPayload([
        'projectName' => 'New Name',
    ]));

    $response->assertOk()->assertJsonPath('data.projectName', 'New Name');
    expect($project->fresh()->project_name)->toBe('New Name');
});

test('update rejects an invalid payload', function () {
    $project = Project::factory()->create();

    $this->putJson("/api/projects/{$project->id}", validProjectPayload(['clientName' => '']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['client_name']);
});

test('destroy deletes a project', function () {
    $project = Project::factory()->create();

    $this->deleteJson("/api/projects/{$project->id}")->assertNoContent();

    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});
