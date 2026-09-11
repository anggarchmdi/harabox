<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'order_code' => $this->order_code,
            'customers_name' => $this->customers_name,
            'customers_phone' => $this->customers_phone,
            'event_date' => $this->event_date?->format('Y-m-d') ?? $this->event_date,
            'event_time' => $this->event_time,
            'delivery_address' => $this->delivery_address,
            'notes' => $this->notes,
            'subtotal' => (string) $this->subtotal,
            'delivery_fee' => (string) $this->delivery_fee,
            'total' => (string) $this->total,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
