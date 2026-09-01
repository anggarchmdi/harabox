export interface Addon {
  id: number
  name: string
  slug: string
  description?: string | null
  price: string
  image?: string | null
  is_active: boolean
}
