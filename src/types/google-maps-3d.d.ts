/// <reference types="@googlemaps/js-api-loader" />

declare namespace google.maps {
  export interface Map3DElement extends HTMLElement {
    center: LatLngLiteral | LatLng
    range?: number
    tilt?: number
    heading?: number
    roll?: number
  }
  
  export interface Map3DElementConstructor {
    new(options: {
      center: LatLngLiteral | LatLng
      range?: number
      tilt?: number
      heading?: number
      roll?: number
    }): Map3DElement
  }
}

declare global {
  interface Window {
    google: typeof google
  }
}

export {}
