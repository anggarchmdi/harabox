import type { AddonGroup } from './addon'

export interface ProductCategory {
  id: number
  name: string
  slug: string
}

export interface Product {
  id: number
  category_id: number
  name: string
  slug: string
  description?: string | null
  price: string
  minimum_order: number
  addons_enabled?: boolean
  image?: string | null
  is_active: boolean
  category?: ProductCategory | null
  addon_groups?: AddonGroup[]
  addonGroups?: AddonGroup[]
}

export interface ProductPackageAddon {
  id?: number
  name: string
  price: number
  is_active?: boolean
}

export interface CreateProductRequest {
  category_id: number
  name: string
  description?: string
  price: number
  minimum_order: number
  addons_enabled?: boolean
  addon_group_ids?: number[]
  addons?: ProductPackageAddon[]
  image?: File | null
  is_active: boolean
}

export interface UpdateProductRequest {
  category_id?: number
  name?: string
  description?: string
  price?: number
  minimum_order?: number
  addons_enabled?: boolean
  addon_group_ids?: number[]
  addons?: ProductPackageAddon[]
  image?: File | null
  is_active?: boolean
}
