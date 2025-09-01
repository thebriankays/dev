// Mock modules for URI.js dependencies
export const IPv6 = {
  best: function(address) { return address; }
};

export const punycode = {
  toASCII: function(domain) { return domain; },
  toUnicode: function(domain) { return domain; }
};

export const SecondLevelDomains = {
  get: function(domain) { return null; },
  has: function(domain) { return false; }
};