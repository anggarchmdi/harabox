import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItemAddon {
  addon_id: number
  addon_name: string
  addon_group_name: string
  price: number
}

export interface CartItem {
  id: string
  product_id: number
  product_name: string
  product_slug: string
  product_image?: string | null
  base_price: number
  quantity: number
  minimum_order: number
  lead_time_days: number
  step: number
  portion_mode: 'kelipatan10' | 'satuan'
  addons: CartItemAddon[]
  addon_price_per_unit: number
  unit_price: number
  subtotal: number
  selected: boolean
}

export interface AddToCartInput {
  product_id: number
  product_name: string
  product_slug: string
  product_image?: string | null
  base_price: number
  quantity: number
  minimum_order: number
  lead_time_days?: number
  step?: number
  portion_mode?: 'kelipatan10' | 'satuan'
  addons?: CartItemAddon[]
}

interface CartState {
  items: CartItem[]

  // Actions
  addItem: (input: AddToCartInput) => void
  removeItem: (id: string) => void
  removeSelected: () => void
  updateQuantity: (id: string, quantity: number) => void
  stepQuantity: (id: string, direction: 'increase' | 'decrease') => void
  toggleSelect: (id: string) => void
  selectAll: (selected: boolean) => void
  clearCart: () => void
  clearOrderedItems: (ids: string[]) => void

  // Selectors
  getSelectedItems: () => CartItem[]
  getTotalDistinctItems: () => number
  getSelectedDistinctItems: () => number
  getSelectedTotalPortions: () => number
  getSelectedSubtotal: () => number
  getSelectedMaxLeadTimeDays: () => number
}

export function generateCartItemId(productId: number, addons: CartItemAddon[] = []): string {
  const sortedAddonIds = [...addons]
    .map((a) => a.addon_id)
    .sort((a, b) => a - b)
    .join('_')
  return `${productId}-${sortedAddonIds}`
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (input) => {
        const addons = input.addons ?? []
        const id = generateCartItemId(input.product_id, addons)
        const addonPricePerUnit = addons.reduce((sum, a) => sum + (Number(a.price) || 0), 0)
        const unitPrice = Number(input.base_price) + addonPricePerUnit
        const leadTime = input.lead_time_days ?? 3
        const portionMode = input.portion_mode ?? 'kelipatan10'
        const step = input.step ?? (portionMode === 'kelipatan10' ? 10 : 1)

        set((state) => {
          const existingIndex = state.items.findIndex((item) => item.id === id)

          if (existingIndex > -1) {
            // Merge duplicate item (same product + exact same addons)
            const updatedItems = [...state.items]
            const existing = updatedItems[existingIndex]
            const newQuantity = existing.quantity + input.quantity

            updatedItems[existingIndex] = {
              ...existing,
              quantity: newQuantity,
              subtotal: existing.unit_price * newQuantity,
              selected: true, // Auto-select when adding
            }

            return { items: updatedItems }
          }

          // New distinct cart item
          const newItem: CartItem = {
            id,
            product_id: input.product_id,
            product_name: input.product_name,
            product_slug: input.product_slug,
            product_image: input.product_image,
            base_price: Number(input.base_price),
            quantity: input.quantity,
            minimum_order: input.minimum_order,
            lead_time_days: leadTime,
            step,
            portion_mode: portionMode,
            addons,
            addon_price_per_unit: addonPricePerUnit,
            unit_price: unitPrice,
            subtotal: unitPrice * input.quantity,
            selected: true,
          }

          return { items: [newItem, ...state.items] }
        })
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      removeSelected: () => {
        set((state) => ({
          items: state.items.filter((item) => !item.selected),
        }))
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            const validQty = Math.max(item.minimum_order, quantity)
            return {
              ...item,
              quantity: validQty,
              subtotal: item.unit_price * validQty,
            }
          }),
        }))
      },

      stepQuantity: (id, direction) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            const stepVal = item.step || (item.portion_mode === 'kelipatan10' ? 10 : 1)
            let newQty = direction === 'increase' ? item.quantity + stepVal : item.quantity - stepVal
            if (newQty < item.minimum_order) {
              newQty = item.minimum_order
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: item.unit_price * newQty,
            }
          }),
        }))
      },

      toggleSelect: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, selected: !item.selected } : item
          ),
        }))
      },

      selectAll: (selected) => {
        set((state) => ({
          items: state.items.map((item) => ({ ...item, selected })),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      clearOrderedItems: (ids) => {
        set((state) => ({
          items: state.items.filter((item) => !ids.includes(item.id)),
        }))
      },

      getSelectedItems: () => {
        return get().items.filter((item) => item.selected)
      },

      getTotalDistinctItems: () => {
        return get().items.length
      },

      getSelectedDistinctItems: () => {
        return get().items.filter((item) => item.selected).length
      },

      getSelectedTotalPortions: () => {
        return get()
          .items.filter((item) => item.selected)
          .reduce((sum, item) => sum + item.quantity, 0)
      },

      getSelectedSubtotal: () => {
        return get()
          .items.filter((item) => item.selected)
          .reduce((sum, item) => sum + item.subtotal, 0)
      },

      getSelectedMaxLeadTimeDays: () => {
        const selected = get().items.filter((item) => item.selected)
        if (selected.length === 0) return 0
        return Math.max(0, ...selected.map((item) => item.lead_time_days || 0))
      },
    }),
    {
      name: 'harabox_cart_storage',
    }
  )
)
