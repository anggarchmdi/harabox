<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemAddonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'addon_id' => $this->addon_id,
            'addon_group_name' => $this->addon_group_name,
            'addon_name' => $this->addon_name,
            'price' => (string) $this->price,
            'quantity' => (int) $this->quantity,
            'subtotal' => (string) $this->subtotal,
        ];
    }
}
