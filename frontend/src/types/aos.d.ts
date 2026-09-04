declare module 'aos' {
  export interface AosOptions {
    offset?: number
    delay?: number
    duration?: number
    easing?: string
    once?: boolean
    mirror?: boolean
    anchorPlacement?: string
    startEvent?: string
    disable?: boolean | 'phone' | 'tablet' | 'mobile' | (() => boolean)
    animatedClassName?: string
    initClassName?: string
    useClassNames?: boolean
    disableMutationObserver?: boolean
    debounceDelay?: number
    throttleDelay?: number
  }

  const aos: {
    init: (options?: AosOptions) => void
    refresh: () => void
    refreshHard: () => void
  }

  export default aos
}
