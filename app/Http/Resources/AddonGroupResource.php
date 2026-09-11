<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddonGroupResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'is_required' => (bool) $this->is_required,
            'min_selection' => (int) $this->min_selection,
            'max_selection' => (int) $this->max_selection,
            'is_active' => (bool) $this->is_active,
            'addons' => AddonResource::collection($this->whenLoaded('addons')),
        ];
    }
}
