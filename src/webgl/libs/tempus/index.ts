// Tempus Time Control Library
// Advanced time manipulation for WebGL animations

export interface TimelineMarker {
  time: number
  callback: () => void
  triggered: boolean
}

export interface Timeline {
  id: string
  duration: number
  currentTime: number
  speed: number
  loop: boolean
  markers: TimelineMarker[]
  playing: boolean
}

export class Tempus {
  private time: number = 0
  private deltaTime: number = 0
  private lastTime: number = 0
  private timelines: Map<string, Timeline> = new Map()
  private globalSpeed: number = 1
  private paused: boolean = false

  constructor() {
    this.time = performance.now()
    this.lastTime = this.time
  }

  update(time: number) {
    if (this.paused) return

    this.time = time
    this.deltaTime = (this.time - this.lastTime) * this.globalSpeed
    this.lastTime = this.time

    this.timelines.forEach(timeline => {
      if (!timeline.playing) return

      timeline.currentTime += this.deltaTime * timeline.speed

      // Check markers
      timeline.markers.forEach(marker => {
        if (!marker.triggered && timeline.currentTime >= marker.time) {
          marker.callback()
          marker.triggered = true
        }
      })

      // Handle looping
      if (timeline.loop && timeline.currentTime >= timeline.duration) {
        timeline.currentTime = timeline.currentTime % timeline.duration
        // Reset markers
        timeline.markers.forEach(marker => {
          marker.triggered = false
        })
      }
    })
  }

  createTimeline(id: string, duration: number, options?: {
    speed?: number
    loop?: boolean
    autoplay?: boolean
  }): Timeline {
    const timeline: Timeline = {
      id,
      duration,
      currentTime: 0,
      speed: options?.speed || 1,
      loop: options?.loop || false,
      markers: [],
      playing: options?.autoplay !== false,
    }

    this.timelines.set(id, timeline)
    return timeline
  }

  getTimeline(id: string): Timeline | undefined {
    return this.timelines.get(id)
  }

  addMarker(timelineId: string, time: number, callback: () => void) {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) return

    timeline.markers.push({
      time,
      callback,
      triggered: false,
    })
  }

  play(timelineId?: string) {
    if (timelineId) {
      const timeline = this.timelines.get(timelineId)
      if (timeline) timeline.playing = true
    } else {
      this.paused = false
    }
  }

  pause(timelineId?: string) {
    if (timelineId) {
      const timeline = this.timelines.get(timelineId)
      if (timeline) timeline.playing = false
    } else {
      this.paused = true
    }
  }

  reset(timelineId: string) {
    const timeline = this.timelines.get(timelineId)
    if (!timeline) return

    timeline.currentTime = 0
    timeline.markers.forEach(marker => {
      marker.triggered = false
    })
  }

  setGlobalSpeed(speed: number) {
    this.globalSpeed = speed
  }

  getTime(): number {
    return this.time
  }

  getDelta(): number {
    return this.deltaTime
  }

  destroy() {
    this.timelines.clear()
  }
}