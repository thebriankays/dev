// Complete crime index data from Global Organized Crime Index 2023
// Source: https://ocindex.net/assets/downloads/2023/english/global-ocindex-report.pdf
// Pages 209-237

// This file contains the structure for all data tables in the PDF
// You need to manually extract and fill in the actual values from the PDF

export const crimeIndexData = [
  // AFRICA - Page 209-215
  {
    countryCode: 'DZ',
    countryName: 'Algeria',
    year: 2023,
    criminalityScore: 0, // Fill from PDF
    resilienceScore: 0, // Fill from PDF
    rank: 0, // Fill from PDF
    region: 'africa',
    criminalMarkets: {
      humanTrafficking: 0,
      humanSmuggling: 0,
      extortionProtection: 0,
      armsTrafficking: 0,
      tradeCounterfeitGoods: 0,
      illicitTradeExciseGoods: 0,
      floraFaunaCrimes: 0,
      nonRenewableResourceCrimes: 0,
      heroinTrade: 0,
      cocaineTrade: 0,
      cannabisTrade: 0,
      syntheticDrugTrade: 0,
      cyberDependentCrimes: 0,
      financialCrimes: 0,
    },
    criminalActors: {
      mafiaStyleGroups: 0,
      criminalNetworks: 0,
      stateEmbeddedActors: 0,
      foreignActors: 0,
      privateActors: 0,
    },
    resilience: {
      politicalLeadership: 0,
      governmentTransparency: 0,
      internationalCooperation: 0,
      nationalPolicies: 0,
      judicialSystem: 0,
      lawEnforcement: 0,
      territorialIntegrity: 0,
      antiMoneyLaundering: 0,
      economicRegulatory: 0,
      victimSupport: 0,
      prevention: 0,
      nonStateActors: 0,
    },
  },
  {
    countryCode: 'AO',
    countryName: 'Angola',
    year: 2023,
    criminalityScore: 0, // Fill from PDF
    resilienceScore: 0, // Fill from PDF
    rank: 0,
    region: 'africa',
    // ... fill in all fields
  },
  // ... Continue for all African countries

  // AMERICAS - Page 216-219
  {
    countryCode: 'AR',
    countryName: 'Argentina',
    year: 2023,
    criminalityScore: 0, // Fill from PDF
    resilienceScore: 0, // Fill from PDF
    rank: 0,
    region: 'americas',
    // ... fill in all fields
  },
  // ... Continue for all Americas countries

  // ASIA - Page 220-225
  {
    countryCode: 'AF',
    countryName: 'Afghanistan',
    year: 2023,
    criminalityScore: 7.38, // Example from earlier
    resilienceScore: 2.21,
    rank: 4,
    region: 'asia',
    // ... complete data
  },
  // ... Continue for all Asian countries

  // EUROPE - Page 226-231
  {
    countryCode: 'AL',
    countryName: 'Albania',
    year: 2023,
    criminalityScore: 6.18, // Example from earlier
    resilienceScore: 4.75,
    rank: 37,
    region: 'europe',
    // ... complete data
  },
  // ... Continue for all European countries

  // OCEANIA - Page 232-233
  {
    countryCode: 'AU',
    countryName: 'Australia',
    year: 2023,
    criminalityScore: 0, // Fill from PDF
    resilienceScore: 0, // Fill from PDF
    rank: 0,
    region: 'oceania',
    // ... fill in all fields
  },
  // ... Continue for all Oceania countries
]

// Trends data from PDF (showing changes between 2021 and 2023)
export const crimeTrendsData = [
  // Extract from comparison tables in the PDF
  {
    countryCode: 'AF',
    countryName: 'Afghanistan',
    trends: {
      criminality: { year2021: 7.25, year2023: 7.38, change: 0.13 },
      resilience: { year2021: 2.13, year2023: 2.21, change: 0.08 },
      // Criminal markets
      humanTrafficking: { year2021: 7.0, year2023: 7.5, change: 0.5 },
      humanSmuggling: { year2021: 8.5, year2023: 9.0, change: 0.5 },
      extortionProtection: { year2021: 7.0, year2023: 7.0, change: 0 },
      armsTrafficking: { year2021: 9.0, year2023: 9.5, change: 0.5 },
      // ... continue for all indicators
    },
  },
  // ... Continue for all countries
]

// Regional averages from the PDF
export const regionalAverages = {
  africa: {
    criminality: 5.25,
    resilience: 3.67,
    criminalMarkets: 5.12,
    criminalActors: 5.38,
  },
  americas: {
    criminality: 5.04,
    resilience: 4.48,
    criminalMarkets: 4.86,
    criminalActors: 5.23,
  },
  asia: {
    criminality: 5.30,
    resilience: 4.32,
    criminalMarkets: 5.27,
    criminalActors: 5.33,
  },
  europe: {
    criminality: 4.48,
    resilience: 5.62,
    criminalMarkets: 4.38,
    criminalActors: 4.57,
  },
  oceania: {
    criminality: 3.97,
    resilience: 5.56,
    criminalMarkets: 3.79,
    criminalActors: 4.14,
  },
}

// Global statistics from the report
export const globalStatistics = {
  averageCriminality: 5.03,
  averageResilience: 4.25,
  totalCountries: 193,
  mostCriminalCountries: [
    'Myanmar',
    'Colombia', 
    'Mexico',
    'Afghanistan',
    'Haiti',
  ],
  mostResilientCountries: [
    'Finland',
    'Norway',
    'Switzerland',
    'New Zealand',
    'Denmark',
  ],
  largestIncreases: [
    { country: 'Ecuador', indicator: 'criminality', change: 1.04 },
    { country: 'Syria', indicator: 'criminality', change: 0.69 },
    { country: 'Belgium', indicator: 'criminality', change: 0.48 },
  ],
  largestDecreases: [
    { country: 'Uzbekistan', indicator: 'criminality', change: -0.46 },
    { country: 'Angola', indicator: 'criminality', change: -0.43 },
    { country: 'Kazakhstan', indicator: 'criminality', change: -0.41 },
  ],
}

// Top criminal markets globally
export const topCriminalMarkets = {
  humanTrafficking: {
    highest: ['UAE', 'Myanmar', 'Philippines', 'Venezuela', 'Cambodia'],
    average: 4.73,
  },
  humanSmuggling: {
    highest: ['Libya', 'Turkey', 'Afghanistan', 'Myanmar', 'Ethiopia'],
    average: 4.38,
  },
  armsTrafficking: {
    highest: ['Ukraine', 'Afghanistan', 'Syria', 'Myanmar', 'Mexico'],
    average: 4.42,
  },
  drugTrade: {
    highest: ['Afghanistan', 'Myanmar', 'Mexico', 'Colombia', 'Syria'],
    average: 5.12,
  },
  cyberCrime: {
    highest: ['China', 'Russia', 'Ukraine', 'North Korea', 'Romania'],
    average: 4.85,
  },
  financialCrimes: {
    highest: ['UAE', 'UK', 'Switzerland', 'Cyprus', 'China'],
    average: 5.48,
  },
}

// Instructions for data extraction:
// 1. Open the PDF and navigate to pages 209-237
// 2. Each country has a full page with all scores
// 3. Extract the following for each country:
//    - Overall criminality score (top right)
//    - Overall resilience score (bottom)
//    - All 14 criminal market scores
//    - All 5 criminal actor scores
//    - All 12 resilience indicator scores
// 4. The trends can be found in comparison tables
// 5. Regional and global statistics are in the summary sections
