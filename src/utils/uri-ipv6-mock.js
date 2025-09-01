// Mock IPv6 module for URI.js
const IPv6 = {
  best: function(address) { return address; }
};

export default IPv6;
export const best = IPv6.best;