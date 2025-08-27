// Complete mapping of CIA Factbook country codes to ISO 3166-1 alpha-2 codes
export const CIA_CODE_TO_ISO: Record<string, string> = {
  // A
  'aa': 'AW',  // Aruba
  'ac': 'AG',  // Antigua and Barbuda
  'ae': 'AE',  // United Arab Emirates
  'af': 'AF',  // Afghanistan
  'ag': 'DZ',  // Algeria
  'aj': 'AZ',  // Azerbaijan
  'al': 'AL',  // Albania
  'am': 'AM',  // Armenia
  'an': 'AD',  // Andorra
  'ao': 'AO',  // Angola
  'ar': 'AR',  // Argentina
  'as': 'AU',  // Australia
  'au': 'AT',  // Austria
  'av': 'AI',  // Anguilla
  'ax': 'AX',  // Akrotiri (UK base in Cyprus)
  'ay': 'AQ',  // Antarctica
  
  // B
  'ba': 'BH',  // Bahrain
  'bb': 'BB',  // Barbados
  'bc': 'BW',  // Botswana
  'bd': 'BM',  // Bermuda
  'be': 'BE',  // Belgium
  'bf': 'BS',  // Bahamas
  'bg': 'BD',  // Bangladesh
  'bh': 'BZ',  // Belize
  'bk': 'BA',  // Bosnia and Herzegovina
  'bl': 'BO',  // Bolivia
  'bm': 'MM',  // Myanmar (Burma)
  'bn': 'BJ',  // Benin
  'bo': 'BY',  // Belarus
  'bp': 'SB',  // Solomon Islands
  'br': 'BR',  // Brazil
  'bt': 'BT',  // Bhutan
  'bu': 'BG',  // Bulgaria
  'bv': 'BV',  // Bouvet Island
  'bx': 'BN',  // Brunei
  'by': 'BI',  // Burundi
  
  // C
  'ca': 'CA',  // Canada
  'cb': 'KH',  // Cambodia
  'cc': 'CC',  // Cocos (Keeling) Islands
  'cd': 'TD',  // Chad
  'ce': 'LK',  // Sri Lanka
  'cf': 'CG',  // Congo (Brazzaville)
  'cg': 'CD',  // Congo (Kinshasa) - DRC
  'ch': 'CN',  // China
  'ci': 'CL',  // Chile
  'cj': 'KY',  // Cayman Islands
  'ck': 'CK',  // Cook Islands
  'cm': 'CM',  // Cameroon
  'cn': 'KM',  // Comoros
  'co': 'CO',  // Colombia
  'cr': 'CR',  // Costa Rica
  'cs': 'CR',  // Costa Rica (duplicate)
  'ct': 'CF',  // Central African Republic
  'cu': 'CU',  // Cuba
  'cv': 'CV',  // Cabo Verde
  'cw': 'CK',  // Cook Islands (duplicate)
  'cy': 'CY',  // Cyprus
  'cz': 'CZ',  // Czech Republic
  
  // D
  'da': 'DK',  // Denmark
  'dj': 'DJ',  // Djibouti
  'do': 'DM',  // Dominica
  'dr': 'DO',  // Dominican Republic
  'dx': 'DK',  // Dhekelia (UK base in Cyprus)
  
  // E
  'ec': 'EC',  // Ecuador
  'ee': 'EU',  // European Union
  'eg': 'EG',  // Egypt
  'ei': 'IE',  // Ireland
  'ek': 'GQ',  // Equatorial Guinea
  'en': 'EE',  // Estonia
  'er': 'ER',  // Eritrea
  'es': 'SV',  // El Salvador
  'et': 'ET',  // Ethiopia
  'ez': 'CZ',  // Czech Republic (old code)
  
  // F
  'fi': 'FI',  // Finland
  'fj': 'FJ',  // Fiji
  'fk': 'FK',  // Falkland Islands
  'fm': 'FM',  // Micronesia
  'fo': 'FO',  // Faroe Islands
  'fp': 'PF',  // French Polynesia
  'fr': 'FR',  // France
  'fs': 'TF',  // French Southern and Antarctic Lands
  
  // G
  'ga': 'GM',  // Gambia
  'gb': 'GA',  // Gabon
  'gd': 'GD',  // Grenada
  'gg': 'GE',  // Georgia
  'gh': 'GH',  // Ghana
  'gi': 'GI',  // Gibraltar
  'gj': 'GD',  // Grenada (duplicate)
  'gk': 'GG',  // Guernsey
  'gl': 'GL',  // Greenland
  'gm': 'DE',  // Germany
  'gp': 'GP',  // Guadeloupe
  'gq': 'GU',  // Guam
  'gr': 'GR',  // Greece
  'gt': 'GT',  // Guatemala
  'gv': 'GN',  // Guinea
  'gy': 'GY',  // Guyana
  'gz': 'PS',  // Gaza Strip (Palestine)
  
  // H
  'ha': 'HT',  // Haiti
  'hk': 'HK',  // Hong Kong
  'hm': 'HM',  // Heard Island and McDonald Islands
  'ho': 'HN',  // Honduras
  'hr': 'HR',  // Croatia
  'hu': 'HU',  // Hungary
  
  // I
  'ic': 'IS',  // Iceland
  'id': 'ID',  // Indonesia
  'im': 'IM',  // Isle of Man
  'in': 'IN',  // India
  'io': 'IO',  // British Indian Ocean Territory
  'ip': 'FK',  // Clipperton Island
  'ir': 'IR',  // Iran
  'is': 'IL',  // Israel
  'it': 'IT',  // Italy
  'iv': 'CI',  // Côte d'Ivoire
  'iz': 'IQ',  // Iraq
  
  // J
  'ja': 'JP',  // Japan
  'je': 'JE',  // Jersey
  'jm': 'JM',  // Jamaica
  'jn': 'SJ',  // Jan Mayen
  'jo': 'JO',  // Jordan
  'jq': 'UM',  // Johnston Atoll
  'ju': 'UM',  // Juan de Nova Island
  
  // K
  'ka': 'KZ',  // Kazakhstan
  'kb': 'KG',  // Kyrgyzstan
  'ke': 'KE',  // Kenya
  'kg': 'KG',  // Kyrgyzstan (duplicate)
  'kn': 'KP',  // North Korea
  'kr': 'KI',  // Kiribati
  'ks': 'KR',  // South Korea
  'kt': 'CX',  // Christmas Island
  'ku': 'KW',  // Kuwait
  'kv': 'XK',  // Kosovo
  'kz': 'KZ',  // Kazakhstan (duplicate)
  
  // L
  'la': 'LA',  // Laos
  'le': 'LB',  // Lebanon
  'lg': 'LV',  // Latvia
  'lh': 'LT',  // Lithuania
  'li': 'LR',  // Liberia
  'lo': 'SK',  // Slovakia
  'ls': 'LI',  // Liechtenstein
  'lt': 'LS',  // Lesotho
  'lu': 'LU',  // Luxembourg
  'ly': 'LY',  // Libya
  
  // M
  'ma': 'MG',  // Madagascar
  'mb': 'MQ',  // Martinique
  'mc': 'MO',  // Macau
  'md': 'MD',  // Moldova
  'mf': 'YT',  // Mayotte
  'mg': 'MN',  // Mongolia
  'mh': 'MS',  // Montserrat
  'mi': 'MW',  // Malawi
  'mj': 'ME',  // Montenegro
  'mk': 'MK',  // North Macedonia
  'ml': 'ML',  // Mali
  'mn': 'MC',  // Monaco
  'mo': 'MA',  // Morocco
  'mp': 'MU',  // Mauritius
  'mq': 'UM',  // Midway Islands
  'mr': 'MR',  // Mauritania
  'mt': 'MT',  // Malta
  'mu': 'OM',  // Oman
  'mv': 'MV',  // Maldives
  'mx': 'MX',  // Mexico
  'my': 'MY',  // Malaysia
  'mz': 'MZ',  // Mozambique
  
  // N
  'nc': 'NC',  // New Caledonia
  'ne': 'NU',  // Niue
  'nf': 'NF',  // Norfolk Island
  'ng': 'NE',  // Niger
  'nh': 'VU',  // Vanuatu
  'ni': 'NG',  // Nigeria
  'nk': 'MK',  // North Macedonia (old code)
  'nl': 'NL',  // Netherlands
  'nn': 'SX',  // Sint Maarten
  'no': 'NO',  // Norway
  'np': 'NP',  // Nepal
  'nr': 'NR',  // Nauru
  'ns': 'SR',  // Suriname
  'nt': 'AN',  // Netherlands Antilles (dissolved)
  'nu': 'NI',  // Nicaragua
  'nz': 'NZ',  // New Zealand
  
  // O
  'od': 'SS',  // South Sudan
  
  // P
  'pa': 'PY',  // Paraguay
  'pc': 'PN',  // Pitcairn Islands
  'pe': 'PE',  // Peru
  'pf': 'PF',  // French Polynesia (duplicate)
  'pg': 'PL',  // Poland
  'ph': 'PH',  // Philippines
  'pk': 'PK',  // Pakistan
  'pl': 'PL',  // Poland (duplicate)
  'pm': 'PA',  // Panama
  'po': 'PT',  // Portugal
  'pp': 'PG',  // Papua New Guinea
  'ps': 'PW',  // Palau
  'pu': 'GW',  // Guinea-Bissau
  
  // Q
  'qa': 'QA',  // Qatar
  
  // R
  'rb': 'RS',  // Serbia
  're': 'RE',  // Reunion
  'ri': 'RS',  // Serbia (duplicate)
  'rm': 'MH',  // Marshall Islands
  'rn': 'MF',  // Saint Martin
  'ro': 'RO',  // Romania
  'rp': 'PH',  // Philippines (duplicate)
  'rq': 'PR',  // Puerto Rico
  'rs': 'RU',  // Russia
  'ru': 'RU',  // Russia (duplicate)
  'rw': 'RW',  // Rwanda
  
  // S
  'sa': 'SA',  // Saudi Arabia
  'sb': 'PM',  // Saint Pierre and Miquelon
  'sc': 'KN',  // Saint Kitts and Nevis
  'se': 'SC',  // Seychelles
  'sf': 'ZA',  // South Africa
  'sg': 'SN',  // Senegal
  'sh': 'SH',  // Saint Helena
  'si': 'SI',  // Slovenia
  'sk': 'SK',  // Slovakia (duplicate)
  'sl': 'SL',  // Sierra Leone
  'sm': 'SM',  // San Marino
  'sn': 'SG',  // Singapore
  'so': 'SO',  // Somalia
  'sp': 'ES',  // Spain
  'sr': 'RS',  // Serbia (duplicate)
  'st': 'LC',  // Saint Lucia
  'su': 'SD',  // Sudan
  'sv': 'SE',  // Sweden
  'sw': 'SE',  // Sweden (duplicate)
  'sx': 'GS',  // South Georgia and the South Sandwich Islands
  'sy': 'SY',  // Syria
  'sz': 'CH',  // Switzerland
  
  // T
  'tb': 'BL',  // Saint Barthelemy
  'td': 'TT',  // Trinidad and Tobago
  'te': 'TF',  // Tromelin Island
  'th': 'TH',  // Thailand
  'ti': 'TJ',  // Tajikistan
  'tk': 'TC',  // Turks and Caicos Islands
  'tl': 'TK',  // Tokelau
  'tn': 'TO',  // Tonga
  'to': 'TG',  // Togo
  'tp': 'ST',  // Sao Tome and Principe
  'ts': 'TN',  // Tunisia
  'tt': 'TL',  // Timor-Leste
  'tu': 'TR',  // Turkey
  'tv': 'TV',  // Tuvalu
  'tw': 'TW',  // Taiwan
  'tx': 'TM',  // Turkmenistan
  'tz': 'TZ',  // Tanzania
  
  // U
  'uc': 'CW',  // Curacao
  'ug': 'UG',  // Uganda
  'uk': 'GB',  // United Kingdom
  'um': 'UM',  // United States Minor Outlying Islands
  'up': 'UA',  // Ukraine
  'us': 'US',  // United States
  'uv': 'BF',  // Burkina Faso
  'uy': 'UY',  // Uruguay
  'uz': 'UZ',  // Uzbekistan
  
  // V
  'vc': 'VC',  // Saint Vincent and the Grenadines
  've': 'VE',  // Venezuela
  'vi': 'VG',  // British Virgin Islands
  'vj': 'VI',  // US Virgin Islands
  'vm': 'VN',  // Vietnam
  'vn': 'VN',  // Vietnam (duplicate)
  'vq': 'VI',  // US Virgin Islands (duplicate)
  'vt': 'VA',  // Vatican City
  'vu': 'VU',  // Vanuatu (duplicate)
  
  // W
  'wa': 'NA',  // Namibia
  'we': 'PS',  // West Bank (Palestine)
  'wf': 'WF',  // Wallis and Futuna
  'wi': 'EH',  // Western Sahara
  'wq': 'UM',  // Wake Island
  'ws': 'WS',  // Samoa
  'wz': 'SZ',  // Eswatini (Swaziland)
  
  // X
  'xx': 'XX',  // Unknown
  
  // Y
  'ym': 'YE',  // Yemen
  'yo': 'YE',  // Yemen (duplicate)
  
  // Z
  'za': 'ZM',  // Zambia
  'zi': 'ZW',  // Zimbabwe
  'zn': 'TW',  // Taiwan (duplicate)
  'zz': 'ZZ',  // Unknown
}

// Reverse mapping for convenience
export const ISO_TO_CIA_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CIA_CODE_TO_ISO).map(([cia, iso]) => [iso, cia])
)
