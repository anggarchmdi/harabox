export interface Packages {
    id: number,
    category_id: number,
    name: string,
    slug: string,
    description?: string | null,
    price: string,
    minimum_order: number,
    image?: string | null,
    is_active: boolean
}
