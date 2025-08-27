// Helper script to extract crime index data from the PDF
// Use this template to help organize the data extraction

// Example of how to structure the data for each country
// Each country in the PDF has a full page with scores laid out as follows:

/*
Country Profile Structure (from PDF):

COUNTRY NAME                                    CRIMINALITY SCORE: X.XX
                                               Rank: X/193

CRIMINAL MARKETS (average score)
- Human trafficking: X.X
- Human smuggling: X.X  
- Extortion and protection racketeering: X.X
- Arms trafficking: X.X
- Trade in counterfeit goods: X.X
- Illicit trade in excisable goods: X.X
- Flora and fauna crimes: X.X
- Non-renewable resource crimes: X.X
- Heroin trade: X.X
- Cocaine trade: X.X
- Cannabis trade: X.X
- Synthetic drug trade: X.X
- Cyber-dependent crimes: X.X
- Financial crimes: X.X

CRIMINAL ACTORS (average score)
- Mafia-style groups: X.X
- Criminal networks: X.X
- State-embedded actors: X.X
- Foreign actors: X.X
- Private sector actors: X.X

RESILIENCE SCORE: X.XX
- Political leadership and governance: X.X
- Government transparency and accountability: X.X
- International cooperation: X.X
- National policies and laws: X.X
- Judicial system and detention: X.X
- Law enforcement: X.X
- Territorial integrity: X.X
- Anti-money laundering: X.X
- Economic regulatory capacity: X.X
- Victim and witness support: X.X
- Prevention: X.X
- Non-state actors: X.X
*/

// Template for extracting data:
export const extractCountryData = (
  countryCode: string,
  countryName: string,
  pageNumber: number
) => {
  return {
    countryCode,
    countryName,
    year: 2023,
    criminalityScore: 0, // Top right of page
    resilienceScore: 0, // Bottom section
    rank: 0, // Under criminality score
    region: '', // africa|americas|asia|europe|oceania
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
  }
}

// Page references in the PDF:
export const pdfPageReferences = {
  // AFRICA (Pages 209-215)
  africa: {
    startPage: 209,
    countries: [
      { code: 'DZ', name: 'Algeria' },
      { code: 'AO', name: 'Angola' },
      { code: 'BJ', name: 'Benin' },
      { code: 'BW', name: 'Botswana' },
      { code: 'BF', name: 'Burkina Faso' },
      { code: 'BI', name: 'Burundi' },
      { code: 'CM', name: 'Cameroon' },
      { code: 'CV', name: 'Cape Verde' },
      { code: 'CF', name: 'Central African Republic' },
      { code: 'TD', name: 'Chad' },
      { code: 'KM', name: 'Comoros' },
      { code: 'CG', name: 'Congo' },
      { code: 'CD', name: 'Democratic Republic of the Congo' },
      { code: 'DJ', name: 'Djibouti' },
      { code: 'EG', name: 'Egypt' },
      { code: 'GQ', name: 'Equatorial Guinea' },
      { code: 'ER', name: 'Eritrea' },
      { code: 'SZ', name: 'Eswatini' },
      { code: 'ET', name: 'Ethiopia' },
      { code: 'GA', name: 'Gabon' },
      { code: 'GM', name: 'Gambia' },
      { code: 'GH', name: 'Ghana' },
      { code: 'GN', name: 'Guinea' },
      { code: 'GW', name: 'Guinea-Bissau' },
      { code: 'CI', name: 'Ivory Coast' },
      { code: 'KE', name: 'Kenya' },
      { code: 'LS', name: 'Lesotho' },
      { code: 'LR', name: 'Liberia' },
      { code: 'LY', name: 'Libya' },
      { code: 'MG', name: 'Madagascar' },
      { code: 'MW', name: 'Malawi' },
      { code: 'ML', name: 'Mali' },
      { code: 'MR', name: 'Mauritania' },
      { code: 'MU', name: 'Mauritius' },
      { code: 'MA', name: 'Morocco' },
      { code: 'MZ', name: 'Mozambique' },
      { code: 'NA', name: 'Namibia' },
      { code: 'NE', name: 'Niger' },
      { code: 'NG', name: 'Nigeria' },
      { code: 'RW', name: 'Rwanda' },
      { code: 'ST', name: 'São Tomé and Príncipe' },
      { code: 'SN', name: 'Senegal' },
      { code: 'SC', name: 'Seychelles' },
      { code: 'SL', name: 'Sierra Leone' },
      { code: 'SO', name: 'Somalia' },
      { code: 'ZA', name: 'South Africa' },
      { code: 'SS', name: 'South Sudan' },
      { code: 'SD', name: 'Sudan' },
      { code: 'TZ', name: 'Tanzania' },
      { code: 'TG', name: 'Togo' },
      { code: 'TN', name: 'Tunisia' },
      { code: 'UG', name: 'Uganda' },
      { code: 'ZM', name: 'Zambia' },
      { code: 'ZW', name: 'Zimbabwe' },
    ],
  },
  // AMERICAS (Pages 216-219)
  americas: {
    startPage: 216,
    countries: [
      { code: 'AG', name: 'Antigua and Barbuda' },
      { code: 'AR', name: 'Argentina' },
      { code: 'BS', name: 'Bahamas' },
      { code: 'BB', name: 'Barbados' },
      { code: 'BZ', name: 'Belize' },
      { code: 'BO', name: 'Bolivia' },
      { code: 'BR', name: 'Brazil' },
      { code: 'CA', name: 'Canada' },
      { code: 'CL', name: 'Chile' },
      { code: 'CO', name: 'Colombia' },
      { code: 'CR', name: 'Costa Rica' },
      { code: 'CU', name: 'Cuba' },
      { code: 'DM', name: 'Dominica' },
      { code: 'DO', name: 'Dominican Republic' },
      { code: 'EC', name: 'Ecuador' },
      { code: 'SV', name: 'El Salvador' },
      { code: 'GD', name: 'Grenada' },
      { code: 'GT', name: 'Guatemala' },
      { code: 'GY', name: 'Guyana' },
      { code: 'HT', name: 'Haiti' },
      { code: 'HN', name: 'Honduras' },
      { code: 'JM', name: 'Jamaica' },
      { code: 'MX', name: 'Mexico' },
      { code: 'NI', name: 'Nicaragua' },
      { code: 'PA', name: 'Panama' },
      { code: 'PY', name: 'Paraguay' },
      { code: 'PE', name: 'Peru' },
      { code: 'KN', name: 'Saint Kitts and Nevis' },
      { code: 'LC', name: 'Saint Lucia' },
      { code: 'VC', name: 'Saint Vincent and the Grenadines' },
      { code: 'SR', name: 'Suriname' },
      { code: 'TT', name: 'Trinidad and Tobago' },
      { code: 'US', name: 'United States' },
      { code: 'UY', name: 'Uruguay' },
      { code: 'VE', name: 'Venezuela' },
    ],
  },
  // ASIA (Pages 220-225)
  asia: {
    startPage: 220,
    countries: [
      { code: 'AF', name: 'Afghanistan' },
      { code: 'AM', name: 'Armenia' },
      { code: 'AZ', name: 'Azerbaijan' },
      { code: 'BH', name: 'Bahrain' },
      { code: 'BD', name: 'Bangladesh' },
      { code: 'BT', name: 'Bhutan' },
      { code: 'BN', name: 'Brunei' },
      { code: 'KH', name: 'Cambodia' },
      { code: 'CN', name: 'China' },
      { code: 'GE', name: 'Georgia' },
      { code: 'IN', name: 'India' },
      { code: 'ID', name: 'Indonesia' },
      { code: 'IR', name: 'Iran' },
      { code: 'IQ', name: 'Iraq' },
      { code: 'IL', name: 'Israel' },
      { code: 'JP', name: 'Japan' },
      { code: 'JO', name: 'Jordan' },
      { code: 'KZ', name: 'Kazakhstan' },
      { code: 'KW', name: 'Kuwait' },
      { code: 'KG', name: 'Kyrgyzstan' },
      { code: 'LA', name: 'Laos' },
      { code: 'LB', name: 'Lebanon' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'MV', name: 'Maldives' },
      { code: 'MN', name: 'Mongolia' },
      { code: 'MM', name: 'Myanmar' },
      { code: 'NP', name: 'Nepal' },
      { code: 'KP', name: 'North Korea' },
      { code: 'OM', name: 'Oman' },
      { code: 'PK', name: 'Pakistan' },
      { code: 'PS', name: 'Palestine' },
      { code: 'PH', name: 'Philippines' },
      { code: 'QA', name: 'Qatar' },
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'SG', name: 'Singapore' },
      { code: 'KR', name: 'South Korea' },
      { code: 'LK', name: 'Sri Lanka' },
      { code: 'SY', name: 'Syria' },
      { code: 'TW', name: 'Taiwan' },
      { code: 'TJ', name: 'Tajikistan' },
      { code: 'TH', name: 'Thailand' },
      { code: 'TL', name: 'Timor-Leste' },
      { code: 'TR', name: 'Turkey' },
      { code: 'TM', name: 'Turkmenistan' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'UZ', name: 'Uzbekistan' },
      { code: 'VN', name: 'Vietnam' },
      { code: 'YE', name: 'Yemen' },
    ],
  },
  // EUROPE (Pages 226-231)
  europe: {
    startPage: 226,
    countries: [
      { code: 'AL', name: 'Albania' },
      { code: 'AD', name: 'Andorra' },
      { code: 'AT', name: 'Austria' },
      { code: 'BY', name: 'Belarus' },
      { code: 'BE', name: 'Belgium' },
      { code: 'BA', name: 'Bosnia and Herzegovina' },
      { code: 'BG', name: 'Bulgaria' },
      { code: 'HR', name: 'Croatia' },
      { code: 'CY', name: 'Cyprus' },
      { code: 'CZ', name: 'Czech Republic' },
      { code: 'DK', name: 'Denmark' },
      { code: 'EE', name: 'Estonia' },
      { code: 'FI', name: 'Finland' },
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Germany' },
      { code: 'GR', name: 'Greece' },
      { code: 'HU', name: 'Hungary' },
      { code: 'IS', name: 'Iceland' },
      { code: 'IE', name: 'Ireland' },
      { code: 'IT', name: 'Italy' },
      { code: 'XK', name: 'Kosovo' },
      { code: 'LV', name: 'Latvia' },
      { code: 'LI', name: 'Liechtenstein' },
      { code: 'LT', name: 'Lithuania' },
      { code: 'LU', name: 'Luxembourg' },
      { code: 'MT', name: 'Malta' },
      { code: 'MD', name: 'Moldova' },
      { code: 'MC', name: 'Monaco' },
      { code: 'ME', name: 'Montenegro' },
      { code: 'NL', name: 'Netherlands' },
      { code: 'MK', name: 'North Macedonia' },
      { code: 'NO', name: 'Norway' },
      { code: 'PL', name: 'Poland' },
      { code: 'PT', name: 'Portugal' },
      { code: 'RO', name: 'Romania' },
      { code: 'RU', name: 'Russia' },
      { code: 'SM', name: 'San Marino' },
      { code: 'RS', name: 'Serbia' },
      { code: 'SK', name: 'Slovakia' },
      { code: 'SI', name: 'Slovenia' },
      { code: 'ES', name: 'Spain' },
      { code: 'SE', name: 'Sweden' },
      { code: 'CH', name: 'Switzerland' },
      { code: 'UA', name: 'Ukraine' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'VA', name: 'Vatican City' },
    ],
  },
  // OCEANIA (Pages 232-233)
  oceania: {
    startPage: 232,
    countries: [
      { code: 'AU', name: 'Australia' },
      { code: 'FJ', name: 'Fiji' },
      { code: 'KI', name: 'Kiribati' },
      { code: 'MH', name: 'Marshall Islands' },
      { code: 'FM', name: 'Micronesia' },
      { code: 'NR', name: 'Nauru' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'PW', name: 'Palau' },
      { code: 'PG', name: 'Papua New Guinea' },
      { code: 'WS', name: 'Samoa' },
      { code: 'SB', name: 'Solomon Islands' },
      { code: 'TO', name: 'Tonga' },
      { code: 'TV', name: 'Tuvalu' },
      { code: 'VU', name: 'Vanuatu' },
    ],
  },
}

// Usage instructions:
// 1. For each country in the PDF, use the extractCountryData function
// 2. Fill in all the scores from the country's page
// 3. Add the completed object to the crimeIndexData array in crime-index-data.ts
// 4. The scores are on a 1-10 scale with 0.5 increments
// 5. Make sure to include the criminality rank (e.g., 4/193)
