declare module 'hamo' {
  export interface Rect {
    top?: number
    right?: number
    bottom?: number
    left?: number
    width?: number
    height?: number
    x?: number
    y?: number
  }

  export interface MediaQueryList {
    matches: boolean
    media: string
    addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void
    removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void
    addEventListener: (type: 'change', listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void
    removeEventListener: (type: 'change', listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void
  }

  export function useMediaQuery(query: string): boolean
  
  export class Hamo {
    update(time: number): void
    destroy(): void
  }
}