// Wrapper for Cesium to handle import.meta issues
let Cesium: any;

if (typeof window !== 'undefined') {
  // Dynamically import Cesium only on client side
  import('cesium/Build/Cesium/Cesium.js').then((module) => {
    Cesium = module;
    // Set base URL for Cesium assets
    (window as any).CESIUM_BASE_URL = '/_next/static/cesium';
  });
}

export default Cesium;
export { Cesium };