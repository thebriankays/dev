'use client'

import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { useCanvas } from '@/providers/Canvas'

interface ViewInfo {
  id: string
  element: HTMLElement
  bounds: DOMRect
  visible: boolean
}

export class ViewManager {
  private static instance: ViewManager
  private views: Map<string, ViewInfo> = new Map()
  private observer: IntersectionObserver | null = null
  
  static getInstance(): ViewManager {
    if (!ViewManager.instance) {
      ViewManager.instance = new ViewManager()
    }
    return ViewManager.instance
  }
  
  private constructor() {
    if (typeof window !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const view = this.views.get(entry.target.id)
            if (view) {
              view.visible = entry.isIntersecting
            }
          })
        },
        { threshold: 0.01 }
      )
    }
  }
  
  registerView(id: string, element: HTMLElement) {
    const bounds = element.getBoundingClientRect()
    const viewInfo: ViewInfo = {
      id,
      element,
      bounds,
      visible: true,
    }
    
    this.views.set(id, viewInfo)
    this.observer?.observe(element)
    
    return () => {
      this.observer?.unobserve(element)
      this.views.delete(id)
    }
  }
  
  updateBounds(id: string) {
    const view = this.views.get(id)
    if (view) {
      view.bounds = view.element.getBoundingClientRect()
    }
  }
  
  getView(id: string): ViewInfo | undefined {
    return this.views.get(id)
  }
  
  getAllViews(): ViewInfo[] {
    return Array.from(this.views.values())
  }
  
  getVisibleViews(): ViewInfo[] {
    return this.getAllViews().filter(view => view.visible)
  }
}

export function useViewManager(id: string, elementRef: React.RefObject<HTMLElement>) {
  const manager = useRef(ViewManager.getInstance())
  const { invalidate } = useCanvas()
  
  useEffect(() => {
    if (!elementRef.current) return
    
    const cleanup = manager.current.registerView(id, elementRef.current)
    
    const handleResize = () => {
      manager.current.updateBounds(id)
      invalidate()
    }
    
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)
    
    return () => {
      cleanup()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
    }
  }, [id, elementRef, invalidate])
  
  return manager.current
}