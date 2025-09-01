// Mock punycode module for URI.js
const punycode = {
  toASCII: function(domain) { return domain; },
  toUnicode: function(domain) { return domain; }
};

export default punycode;
export const toASCII = punycode.toASCII;
export const toUnicode = punycode.toUnicode;