<?php

namespace App\Models;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    private const SORTABLE_COLUMNS = [
        'client_name',
        'project_name',
        'status',
        'priority',
        'start_date',
        'due_date',
        'created_at',
    ];

    protected $fillable = [
        'client_name',
        'project_name',
        'description',
        'status',
        'priority',
        'start_date',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'priority' => ProjectPriority::class,
            'start_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
        ];
    }

    /**
     * Shared search/filter/sort query logic used by both the Inertia
     * web controller and the JSON API controller.
     *
     * @param  array{search?: string|null, status?: string|null, priority?: string|null, sort_by?: string|null, sort_dir?: string|null}  $filters
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->where(function (Builder $inner) use ($search) {
                $inner->where('client_name', 'like', "%{$search}%")
                    ->orWhere('project_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (ProjectStatus::tryFrom((string) ($filters['status'] ?? '')) !== null) {
            $query->where('status', $filters['status']);
        }

        if (ProjectPriority::tryFrom((string) ($filters['priority'] ?? '')) !== null) {
            $query->where('priority', $filters['priority']);
        }

        $sortBy = in_array($filters['sort_by'] ?? null, self::SORTABLE_COLUMNS, true)
            ? $filters['sort_by']
            : 'created_at';

        $sortDir = ($filters['sort_dir'] ?? null) === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sortBy, $sortDir);
    }
}
