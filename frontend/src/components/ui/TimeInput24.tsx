import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Clock, Check, X, ChevronDown } from 'lucide-react'
import { useThemeStore } from '../../stores/theme.store'

export interface TimeInput24Props {
  value: string // Format "HH:mm" (e.g. "11:30")
  onChange: (value: string) => void
  placeholder?: string
  isDark?: boolean
  className?: string
  required?: boolean
  id?: string
  name?: string
  disabled?: boolean
}

// 24 Hours: 00 to 23
const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

// Minutes: 00 to 55 (every 5 mins)
const MINUTES_5 = [
  '00', '05', '10', '15', '20', '25',
  '30', '35', '40', '45', '50', '55'
]

export const TimeInput24: React.FC<TimeInput24Props> = ({
  value,
  onChange,
  placeholder = 'Pilih jam (00:00 - 23:59)',
  isDark: propIsDark,
  className = '',
  required = false,
  id,
  name,
  disabled = false,
}) => {
  const storeIsDark = useThemeStore((state) => state.theme === 'dark')
  const isDark = propIsDark !== undefined ? propIsDark : storeIsDark

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hourListRef = useRef<HTMLDivElement>(null)
  const minuteListRef = useRef<HTMLDivElement>(null)

  // Parse existing HH:mm
  const { hourPart, minutePart } = useMemo(() => {
    if (!value || typeof value !== 'string') return { hourPart: '', minutePart: '' }
    const parts = value.split(':')
    const h = parts[0] ? parts[0].padStart(2, '0') : ''
    const m = parts[1] !== undefined ? parts[1].padStart(2, '0') : ''
    return { hourPart: h, minutePart: m }
  }, [value])

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('touchstart', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isOpen])

  // Auto-scroll selected hour & minute into center view when popover opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        if (hourListRef.current && hourPart) {
          const activeHourEl = hourListRef.current.querySelector<HTMLElement>('[data-active="true"]')
          if (activeHourEl) {
            activeHourEl.scrollIntoView({ block: 'center' })
          }
        }
        if (minuteListRef.current && minutePart) {
          const activeMinEl = minuteListRef.current.querySelector<HTMLElement>('[data-active="true"]')
          if (activeMinEl) {
            activeMinEl.scrollIntoView({ block: 'center' })
          }
        }
      })
    }
  }, [isOpen, hourPart, minutePart])

  // Select hour
  const handleSelectHour = (h: string) => {
    const newMinute = minutePart || '00'
    onChange(`${h}:${newMinute}`)
  }

  // Select minute
  const handleSelectMinute = (m: string) => {
    const newHour = hourPart || '11'
    onChange(`${newHour}:${m}`)
  }

  // Handle direct typing in the input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9:]/g, '')

    // Auto colon format if typing digits like "1130"
    if (!raw.includes(':') && raw.length >= 3) {
      const h = raw.slice(0, 2)
      const m = raw.slice(2, 4)
      raw = `${h}:${m}`
    } else if (raw.length === 2 && !value.endsWith(':') && !raw.includes(':')) {
      raw = `${raw}:`
    }

    if (raw.length > 5) {
      raw = raw.slice(0, 5)
    }

    // Validate hour and minute ranges
    if (raw.includes(':')) {
      const [hStr, mStr] = raw.split(':')
      let validH = hStr
      let validM = mStr

      if (hStr.length === 2) {
        const hNum = parseInt(hStr, 10)
        if (hNum > 23) validH = '23'
      }
      if (mStr && mStr.length === 2) {
        const mNum = parseInt(mStr, 10)
        if (mNum > 59) validM = '59'
      }

      const formatted = validM !== undefined ? `${validH}:${validM}` : `${validH}:`
      onChange(formatted)
      return
    }

    onChange(raw)
  }

  // Normalize on blur
  const handleInputBlur = () => {
    if (!value) return
    const parts = value.split(':')
    if (parts.length === 2) {
      const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0))
      const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0))
      const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      onChange(formatted)
    } else if (parts[0] && parts[0].length > 0) {
      const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0))
      onChange(`${String(h).padStart(2, '0')}:00`)
    }
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div
        className={`relative flex items-center w-full h-11 transition rounded-xl border ${
          isDark
            ? 'border-[#60241E] bg-[#1C0B09] text-white focus-within:border-[#F59E0B] focus-within:ring-2 focus-within:ring-[#F59E0B]/20'
            : 'border-[#E6DACD] bg-white text-[#2B120E] focus-within:border-[#D97706] focus-within:ring-2 focus-within:ring-[#D97706]/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`flex items-center justify-center pl-3.5 pr-2 py-2.5 text-stone-400 hover:text-stone-600 transition cursor-pointer ${
            isDark ? 'text-amber-400 hover:text-amber-300' : 'text-[#D97706] hover:text-[#B45309]'
          }`}
          title="Buka pilihan jam (24 jam)"
        >
          <Clock size={16} />
        </button>

        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          className="w-full bg-transparent py-2.5 pr-8 text-xs sm:text-sm font-semibold tracking-wide outline-none placeholder:font-normal placeholder:text-stone-400"
        />

        {value ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="absolute right-2.5 p-1 rounded-md text-stone-400 hover:text-stone-600 transition cursor-pointer"
            title="Hapus waktu"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className="absolute right-2.5 p-1 rounded-md text-stone-400 hover:text-stone-600 transition cursor-pointer"
            title="Buka pilihan jam"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Popover Dropdown (Scroll Down 00-23 & 00-55) */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 top-full mt-1.5 z-[100] w-64 rounded-2xl border p-3 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95 ${
            isDark
              ? 'border-[#60241E] bg-[#1C0B09] text-white shadow-black/80'
              : 'border-[#E6DACD] bg-white text-[#2B120E] shadow-stone-300/60'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/20">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isDark ? 'text-amber-400' : 'text-[#D97706]'
            }`}>
              Format 24 Jam
            </span>
            <div className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
              value
                ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-[#B45309]'
                : isDark ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-400'
            }`}>
              {value ? `${value} WIB` : '--:--'}
            </div>
          </div>

          {/* Column Titles */}
          <div className="grid grid-cols-2 gap-2 pb-1.5 text-center">
            <span className={`text-[11px] font-bold tracking-wider uppercase ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Jam
            </span>
            <span className={`text-[11px] font-bold tracking-wider uppercase ${
              isDark ? 'text-stone-400' : 'text-stone-600'
            }`}>
              Menit
            </span>
          </div>

          {/* Dual Scroll Columns: 00 to 23 & 00 to 55 with short height and overflow scroll */}
          <div className="grid grid-cols-2 gap-2 relative">
            {/* Hour Column (00 - 23 scrollable down) */}
            <div
              ref={hourListRef}
              className="h-36 overflow-y-auto scrollbar-none py-3 space-y-1 overscroll-contain rounded-lg [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]"
            >
              {HOURS_24.map((h) => {
                const isSelected = hourPart === h
                return (
                  <button
                    key={h}
                    type="button"
                    data-active={isSelected ? 'true' : 'false'}
                    onClick={() => handleSelectHour(h)}
                    className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm scale-[1.02]'
                        : isDark
                        ? 'hover:bg-stone-800/80 text-stone-300'
                        : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {h}
                  </button>
                )
              })}
            </div>

            {/* Minute Column (00 - 55 scrollable down) */}
            <div
              ref={minuteListRef}
              className="h-36 overflow-y-auto scrollbar-none py-3 space-y-1 overscroll-contain rounded-lg [mask-image:linear-gradient(to_bottom,transparent,black_12px,black_calc(100%-12px),transparent)]"
            >
              {MINUTES_5.map((m) => {
                const isSelected = minutePart === m
                return (
                  <button
                    key={m}
                    type="button"
                    data-active={isSelected ? 'true' : 'false'}
                    onClick={() => handleSelectMinute(m)}
                    className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm scale-[1.02]'
                        : isDark
                        ? 'hover:bg-stone-800/80 text-stone-300'
                        : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer Action */}
          <div className="mt-2.5 pt-2 border-t border-stone-200/20 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Check size={14} />
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeInput24
