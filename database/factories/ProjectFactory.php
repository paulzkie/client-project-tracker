<?php

namespace Database\Factories;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 month', '+1 month');

        return [
            'client_name' => $this->faker->company(),
            'project_name' => $this->faker->catchPhrase(),
            'description' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(ProjectStatus::cases())->value,
            'priority' => $this->faker->randomElement(ProjectPriority::cases())->value,
            'start_date' => $startDate,
            'due_date' => $this->faker->dateTimeBetween($startDate, '+2 months'),
        ];
    }
}
