<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'price' => (string) $this->price,
            'minimum_order' => (int) $this->minimum_order,
            'lead_time_days' => (int) ($this->lead_time_days ?? 3),
            'addons_enabled' => (bool) $this->addons_enabled,
            'image' => $this->image,
            'is_active' => (bool) $this->is_active,
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                ];
            }),
            'addon_groups' => AddonGroupResource::collection($this->whenLoaded('addonGroups')),
        ];
    }
}
