// Mock SecondLevelDomains module for URI.js
const SecondLevelDomains = {
  get: function(domain) { return null; },
  has: function(domain) { return false; }
};

export default SecondLevelDomains;
export const get = SecondLevelDomains.get;
export const has = SecondLevelDomains.has;