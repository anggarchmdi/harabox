export interface CapacitySummary {
  date: string
  is_closed: boolean
  max_capacity: number
  booked_portions: number
  remaining_portions: number
  is_full: boolean
  percentage_booked: number
  override_note?: string | null
  has_override: boolean
}

export interface CapacityOverride {
  id: number
  date: string
  max_capacity: number
  is_closed: boolean
  note?: string | null
  created_at?: string
  updated_at?: string
}

export interface CapacitySettings {
  daily_box_capacity: number
  overrides: CapacityOverride[]
}
