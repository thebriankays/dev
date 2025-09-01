// Fix for URI.js module loading in browser environment
// This provides mock implementations for optional URI.js dependencies

// Define globals that URI.js expects
if (typeof window !== 'undefined') {
  // Create module mock for browser environment
  if (!window.module) {
    window.module = { exports: {} };
  }
  
  // Define require function that returns our mocks
  if (!window.require) {
    window.require = function(name) {
      if (name === './IPv6' || name.includes('IPv6')) {
        return { best: function(address) { return address; } };
      }
      if (name === './punycode' || name.includes('punycode')) {
        return {
          toASCII: function(domain) { return domain; },
          toUnicode: function(domain) { return domain; }
        };
      }
      if (name === './SecondLevelDomains' || name.includes('SecondLevelDomains')) {
        return {
          get: function(domain) { return null; },
          has: function(domain) { return false; }
        };
      }
      throw new Error('Module not found: ' + name);
    };
  }
}

// Export empty object to satisfy ES module loader
export default {};