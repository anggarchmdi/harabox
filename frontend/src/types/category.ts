export interface Category {
  id: number
  name: string
  slug: string
  description?: string | null
  products_count?: number
}

export interface CategoryForm {
  name: string
  slug: string
  description: string
}

export interface CategoryPagination {
  current_page: number
  data: Category[]
  first_page_url: string
  from: number | null
  last_page: number | null
  last_page_url: string
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}
