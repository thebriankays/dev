declare module '@react-spring/three' {
  import { SpringValue, SpringConfig } from '@react-spring/core'
  import * as THREE from 'three'

  export interface SpringProps {
    from?: any
    to?: any
    loop?: boolean | (() => boolean)
    reset?: boolean
    reverse?: boolean
    delay?: number
    config?: SpringConfig
    onStart?: () => void
    onRest?: () => void
  }

  export function useSpring<T extends object>(props: SpringProps & T): T

  export const animated: {
    [K in keyof JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
      JSX.IntrinsicElements[K] & { [key: string]: SpringValue<any> }
    >
  }

  export const a = animated
}