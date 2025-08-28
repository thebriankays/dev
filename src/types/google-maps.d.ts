declare global {
  interface Window {
    google: typeof google;
  }
}

declare module '@googlemaps/extended-component-library/api_loader.js'
declare module '@googlemaps/extended-component-library/place_picker.js'
declare module '@googlemaps/extended-component-library/place_overview.js'

declare namespace JSX {
  interface IntrinsicElements {
    'gmpx-api-loader': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      key?: string;
      'solution-channel'?: string;
    }, HTMLElement>;
    'gmpx-place-picker': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      placeholder?: string;
      'for-map'?: string;
      ref?: React.Ref<any>;
    }, HTMLElement>;
    'gmpx-place-overview': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      place?: string;
      'google-logo-already-displayed'?: boolean;
    }, HTMLElement>;
  }
}

export {}