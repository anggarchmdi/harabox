<?php

namespace Database\Factories;

use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Testimonial>
 */
class TestimonialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'institution' => fake()->company(),
            'rating' => fake()->numberBetween(4, 5),
            'order_quantity' => fake()->numberBetween(30, 200).' Box',
            'message' => fake()->paragraph(),
            'is_displayed' => true,
            'order_code' => 'HB-'.fake()->unique()->numerify('#####'),
        ];
    }
}
