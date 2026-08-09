<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Project $resource
 */
class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'clientName' => $this->client_name,
            'projectName' => $this->project_name,
            'description' => $this->description,
            'status' => $this->status->value,
            'priority' => $this->priority->value,
            'startDate' => $this->start_date->format('Y-m-d'),
            'dueDate' => $this->due_date->format('Y-m-d'),
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
        ];
    }
}
