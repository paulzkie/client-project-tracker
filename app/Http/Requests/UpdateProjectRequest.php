<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\HasProjectRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    use HasProjectRules;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->projectRules();
    }
}
