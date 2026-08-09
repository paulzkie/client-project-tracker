<?php

namespace App\Http\Requests\Concerns;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use Illuminate\Validation\Rule;

trait HasProjectRules
{
    /**
     * Accept either camelCase (clientName) or snake_case (client_name) request
     * keys and normalize to snake_case before validation, so the API stays
     * consistent with the camelCase shape it returns in ProjectResource.
     */
    protected function prepareForValidation(): void
    {
        $map = [
            'clientName' => 'client_name',
            'projectName' => 'project_name',
            'startDate' => 'start_date',
            'dueDate' => 'due_date',
        ];

        $normalized = [];

        foreach ($map as $camel => $snake) {
            if ($this->has($camel) && ! $this->has($snake)) {
                $normalized[$snake] = $this->input($camel);
            }
        }

        $this->merge($normalized);
    }

    protected function projectRules(): array
    {
        return [
            'client_name' => ['required', 'string', 'max:255'],
            'project_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'priority' => ['required', Rule::enum(ProjectPriority::class)],
            'start_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:start_date'],
        ];
    }
}
