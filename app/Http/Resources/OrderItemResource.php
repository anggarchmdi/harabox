<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'item_name' => $this->item_name,
            'price' => (string) $this->price,
            'quantity' => (int) $this->quantity,
            'subtotal' => (string) $this->subtotal,
            'addons' => OrderItemAddonResource::collection($this->whenLoaded('addons')),
        ];
    }
}
