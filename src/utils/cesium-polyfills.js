// Polyfills for Cesium's optional dependencies
if (typeof window !== 'undefined') {
  // Mock IPv6 module for URI.js
  window.IPv6 = {
    best: function(address) { return address; }
  };
  
  // Mock punycode
  window.punycode = {
    toASCII: function(domain) { return domain; },
    toUnicode: function(domain) { return domain; }
  };
  
  // Mock SecondLevelDomains
  window.SecondLevelDomains = {
    get: function(domain) { return null; },
    has: function(domain) { return false; }
  };
}