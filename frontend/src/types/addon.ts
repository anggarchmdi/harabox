export interface Addon {
  id: number
  name: string
  slug: string
  description?: string | null
  price: string
  image?: string | null
  is_active: boolean
}

export interface AddonGroup {
  id: number
  name: string
  description?: string | null
  is_required: boolean
  min_selection: number
  max_selection: number
  is_active: boolean
  addons: Addon[]
}
