declare module 'tempus' {
  interface TempusOptions {
    priority?: number
  }

  type TempusCallback = (time: number) => void

  class Tempus {
    static add(callback: TempusCallback, options?: TempusOptions): () => void
    add(callback: TempusCallback, options?: TempusOptions): () => void
    update(time: number): void
    destroy(): void
  }

  export default Tempus
}

declare module 'tempus/react' {
  interface UseTempusOptions {
    priority?: number
  }

  export function useTempus(
    callback: (time: number) => void,
    options?: UseTempusOptions
  ): void
}