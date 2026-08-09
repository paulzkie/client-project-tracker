<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = __DIR__.'/data/test_data.json';
        $projects = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

        $now = now();

        $rows = collect($projects)->map(fn (array $project) => [
            'id' => $project['id'],
            'client_name' => $project['clientName'],
            'project_name' => $project['projectName'],
            'description' => $project['description'] ?? null,
            'status' => $project['status'],
            'priority' => $project['priority'],
            'start_date' => $project['startDate'],
            'due_date' => $project['dueDate'],
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::table('projects')->insertOrIgnore($rows);
    }
}
