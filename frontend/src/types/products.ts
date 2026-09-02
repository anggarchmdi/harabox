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
  image?: string | null
  is_active: boolean
  category?: ProductCategory | null
}

export interface CreateProductRequest {
  category_id: number
  name: string
  description?: string
  price: number
  image?: string
  is_active: boolean
}

export interface UpdateProductRequest
  extends CreateProductRequest {}
