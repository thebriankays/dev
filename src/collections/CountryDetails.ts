import type { CollectionConfig } from 'payload'

export const CountryDetails: CollectionConfig = {
  slug: 'country-details',
  labels: {
    singular: 'Country Details',
    plural: 'Country Details',
  },
  admin: {
    useAsTitle: 'country',
    group: 'Location Data',
    defaultColumns: ['country', 'population', 'area', 'governmentType'],
    listSearchableFields: ['governmentType', 'nationalDish', 'climate', 'terrain'],
  },
  fields: [
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    
    // Geographic Details
    {
      name: 'landlocked',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Country has no direct access to the ocean',
      },
    },
    {
      name: 'area',
      type: 'group',
      fields: [
        {
          name: 'total',
          type: 'number',
          admin: {
            description: 'Total area in square kilometers',
          },
        },
        {
          name: 'land',
          type: 'number',
          admin: {
            description: 'Land area in square kilometers',
          },
        },
        {
          name: 'water',
          type: 'number',
          admin: {
            description: 'Water area in square kilometers',
          },
        },
      ],
    },
    {
      name: 'surfaceArea',
      type: 'number',
      admin: {
        description: 'Total surface area in square kilometers',
      },
    },
    {
      name: 'elevation',
      type: 'group',
      fields: [
        {
          name: 'meanElevation',
          type: 'number',
          admin: {
            description: 'Mean elevation in meters',
          },
        },
        {
          name: 'highestPoint',
          type: 'text',
          admin: {
            description: 'Name and elevation of highest point',
          },
        },
        {
          name: 'lowestPoint',
          type: 'text',
          admin: {
            description: 'Name and elevation of lowest point',
          },
        },
      ],
    },
    
    // Demographics
    {
      name: 'population',
      type: 'number',
      admin: {
        description: 'Latest population estimate',
      },
    },
    {
      name: 'populationDensity',
      type: 'number',
      admin: {
        description: 'People per square kilometer',
        step: 0.01,
      },
    },
    {
      name: 'populationGrowthRate',
      type: 'number',
      admin: {
        description: 'Annual growth rate as percentage',
        step: 0.01,
      },
    },
    {
      name: 'birthRate',
      type: 'number',
      admin: {
        description: 'Births per 1000 population',
        step: 0.1,
      },
    },
    {
      name: 'deathRate',
      type: 'number',
      admin: {
        description: 'Deaths per 1000 population',
        step: 0.1,
      },
    },
    {
      name: 'migrationRate',
      type: 'number',
      admin: {
        description: 'Net migration per 1000 population',
        step: 0.1,
      },
    },
    {
      name: 'lifeExpectancy',
      type: 'group',
      fields: [
        {
          name: 'total',
          type: 'number',
          admin: {
            description: 'Average life expectancy in years',
            step: 0.1,
          },
        },
        {
          name: 'male',
          type: 'number',
          admin: {
            description: 'Male life expectancy in years',
            step: 0.1,
          },
        },
        {
          name: 'female',
          type: 'number',
          admin: {
            description: 'Female life expectancy in years',
            step: 0.1,
          },
        },
      ],
    },
    
    // Climate & Environment
    {
      name: 'yearlyAverageTemp',
      type: 'number',
      admin: {
        description: 'Average temperature in Celsius',
        step: 0.1,
      },
    },
    {
      name: 'climate',
      type: 'textarea',
      admin: {
        description: 'Climate description',
      },
    },
    {
      name: 'terrain',
      type: 'textarea',
      admin: {
        description: 'Terrain description',
      },
    },
    {
      name: 'naturalHazards',
      type: 'textarea',
      admin: {
        description: 'Common natural hazards',
      },
    },
    {
      name: 'naturalResources',
      type: 'textarea',
      admin: {
        description: 'Major natural resources',
      },
    },
    
    // Infrastructure & Society
    {
      name: 'drivingSide',
      type: 'select',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
    },
    {
      name: 'governmentType',
      type: 'text',
      admin: {
        description: 'Type of government',
      },
    },
    {
      name: 'chiefOfState',
      type: 'text',
      admin: {
        description: 'Current head of state',
      },
    },
    {
      name: 'headOfGovernment',
      type: 'text',
      admin: {
        description: 'Current head of government',
      },
    },
    
    // Economy
    {
      name: 'gdp',
      type: 'group',
      fields: [
        {
          name: 'nominal',
          type: 'number',
          admin: {
            description: 'GDP in billions USD',
          },
        },
        {
          name: 'perCapita',
          type: 'number',
          admin: {
            description: 'GDP per capita in USD',
          },
        },
        {
          name: 'growthRate',
          type: 'number',
          admin: {
            description: 'Annual GDP growth rate as percentage',
            step: 0.1,
          },
        },
      ],
    },
    
    // Culture
    {
      name: 'nationalDish',
      type: 'text',
      admin: {
        description: 'Traditional national dish',
      },
    },
    {
      name: 'ethnicGroups',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'percentage',
          type: 'number',
          admin: {
            description: 'Percentage of population',
            step: 0.1,
          },
        },
      ],
    },
    
    // Demographics Details
    {
      name: 'ageStructure',
      type: 'group',
      fields: [
        {
          name: 'age0to14',
          type: 'number',
          admin: {
            description: 'Percentage aged 0-14',
            step: 0.1,
          },
        },
        {
          name: 'age15to64',
          type: 'number',
          admin: {
            description: 'Percentage aged 15-64',
            step: 0.1,
          },
        },
        {
          name: 'age65plus',
          type: 'number',
          admin: {
            description: 'Percentage aged 65+',
            step: 0.1,
          },
        },
      ],
    },
    {
      name: 'sexRatio',
      type: 'group',
      fields: [
        {
          name: 'atBirth',
          type: 'number',
          admin: {
            description: 'Males per female at birth',
            step: 0.001,
          },
        },
        {
          name: 'total',
          type: 'number',
          admin: {
            description: 'Males per female in total population',
            step: 0.001,
          },
        },
      ],
    },
    {
      name: 'urbanization',
      type: 'group',
      fields: [
        {
          name: 'urbanPopulation',
          type: 'number',
          admin: {
            description: 'Percentage living in urban areas',
            step: 0.1,
          },
        },
        {
          name: 'rateOfUrbanization',
          type: 'number',
          admin: {
            description: 'Annual rate of urbanization',
            step: 0.1,
          },
        },
      ],
    },
    {
      name: 'majorUrbanAreas',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'population',
          type: 'number',
        },
      ],
    },
    
    // Health & Education
    {
      name: 'healthExpenditure',
      type: 'number',
      admin: {
        description: 'Health expenditure as % of GDP',
        step: 0.1,
      },
    },
    {
      name: 'physicianDensity',
      type: 'number',
      admin: {
        description: 'Physicians per 1000 population',
        step: 0.01,
      },
    },
    {
      name: 'hospitalBedDensity',
      type: 'number',
      admin: {
        description: 'Hospital beds per 1000 population',
        step: 0.01,
      },
    },
    {
      name: 'obesityRate',
      type: 'number',
      admin: {
        description: 'Adult obesity rate as percentage',
        step: 0.1,
      },
    },
    {
      name: 'alcoholConsumption',
      type: 'number',
      admin: {
        description: 'Liters per capita per year',
        step: 0.1,
      },
    },
    {
      name: 'tobaccoUse',
      type: 'number',
      admin: {
        description: 'Percentage of adults who smoke',
        step: 0.1,
      },
    },
    {
      name: 'marriedWomenRate',
      type: 'number',
      admin: {
        description: 'Percentage of women aged 15-49 who are married',
        step: 0.1,
      },
    },
    {
      name: 'literacy',
      type: 'group',
      fields: [
        {
          name: 'total',
          type: 'number',
          admin: {
            description: 'Total literacy rate',
            step: 0.1,
          },
        },
        {
          name: 'male',
          type: 'number',
          admin: {
            description: 'Male literacy rate',
            step: 0.1,
          },
        },
        {
          name: 'female',
          type: 'number',
          admin: {
            description: 'Female literacy rate',
            step: 0.1,
          },
        },
      ],
    },
    {
      name: 'educationExpenditure',
      type: 'number',
      admin: {
        description: 'Education expenditure as % of GDP',
        step: 0.1,
      },
    },
    
    // Environment
    {
      name: 'environmentalIssues',
      type: 'textarea',
      admin: {
        description: 'Major environmental issues',
      },
    },
    {
      name: 'forestArea',
      type: 'number',
      admin: {
        description: 'Forest area as percentage of land area',
        step: 0.1,
      },
    },
    {
      name: 'co2Emissions',
      type: 'number',
      admin: {
        description: 'CO2 emissions in metric tons per capita',
        step: 0.01,
      },
    },
    
    // Communication
    {
      name: 'internetUsers',
      type: 'number',
      admin: {
        description: 'Percentage of population using internet',
        step: 0.1,
      },
    },
    {
      name: 'mobileSubscriptions',
      type: 'number',
      admin: {
        description: 'Mobile subscriptions per 100 population',
        step: 0.1,
      },
    },
    {
      name: 'telephoneLines',
      type: 'number',
      admin: {
        description: 'Fixed telephone lines (total)',
      },
    },
    
    // Additional CIA Factbook fields
    {
      name: 'background',
      type: 'richText',
      admin: {
        description: 'Historical background and overview',
      },
    },
    {
      name: 'independence',
      type: 'group',
      fields: [
        {
          name: 'date',
          type: 'date',
        },
        {
          name: 'from',
          type: 'text',
          admin: {
            description: 'Independence from which country',
          },
        },
      ],
    },
    {
      name: 'constitution',
      type: 'text',
      admin: {
        description: 'Constitutional history',
      },
    },
    {
      name: 'legalSystem',
      type: 'text',
    },
    {
      name: 'suffrage',
      type: 'text',
      admin: {
        description: 'Voting age and requirements',
      },
    },
    {
      name: 'citizenship',
      type: 'textarea',
      admin: {
        description: 'Citizenship requirements',
      },
    },
    {
      name: 'politicalParties',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'leader',
          type: 'text',
        },
        {
          name: 'founded',
          type: 'number',
        },
      ],
    },
    {
      name: 'internationalOrganizations',
      type: 'textarea',
      admin: {
        description: 'Member of which international organizations',
      },
    },
    {
      name: 'diplomaticRepresentationFromUS',
      type: 'group',
      fields: [
        {
          name: 'chiefOfMission',
          type: 'text',
        },
        {
          name: 'embassy',
          type: 'text',
        },
        {
          name: 'telephone',
          type: 'text',
        },
      ],
    },
    {
      name: 'disputes',
      type: 'textarea',
      admin: {
        description: 'International disputes',
      },
    },
    {
      name: 'refugeesAndIdps',
      type: 'group',
      fields: [
        {
          name: 'refugees',
          type: 'number',
        },
        {
          name: 'idps',
          type: 'number',
          admin: {
            description: 'Internally displaced persons',
          },
        },
        {
          name: 'statelessPersons',
          type: 'number',
        },
      ],
    },
    {
      name: 'trafficking',
      type: 'textarea',
      admin: {
        description: 'Human trafficking situation',
      },
    },
    {
      name: 'illicitDrugs',
      type: 'textarea',
      admin: {
        description: 'Illicit drugs situation',
      },
    },
    
    // Economy - Enhanced fields
    {
      name: 'economyOverview',
      type: 'textarea',
      admin: {
        description: 'Economic overview',
      },
    },
    {
      name: 'laborForce',
      type: 'number',
      admin: {
        description: 'Total labor force',
      },
    },
    {
      name: 'unemploymentRate',
      type: 'number',
      admin: {
        description: 'Unemployment rate as percentage',
        step: 0.1,
      },
    },
    {
      name: 'agricultureProducts',
      type: 'textarea',
      admin: {
        description: 'Major agricultural products',
      },
    },
    {
      name: 'industries',
      type: 'textarea',
      admin: {
        description: 'Major industries',
      },
    },
    {
      name: 'exports',
      type: 'textarea',
      admin: {
        description: 'Major exports',
      },
    },
    {
      name: 'imports',
      type: 'textarea',
      admin: {
        description: 'Major imports',
      },
    },
    {
      name: 'publicDebt',
      type: 'number',
      admin: {
        description: 'Public debt as % of GDP',
        step: 0.1,
      },
    },
    {
      name: 'taxesAndRevenues',
      type: 'number',
      admin: {
        description: 'Taxes and revenues as % of GDP',
        step: 0.1,
      },
    },
    {
      name: 'inflationRate',
      type: 'number',
      admin: {
        description: 'Annual inflation rate',
        step: 0.1,
      },
    },
    
    // Military and Security
    {
      name: 'militaryExpenditure',
      type: 'number',
      admin: {
        description: 'Military expenditure as % of GDP',
        step: 0.1,
      },
    },
    {
      name: 'militaryBranches',
      type: 'textarea',
      admin: {
        description: 'Military service branches',
      },
    },
    
    // Energy
    {
      name: 'energyProduction',
      type: 'number',
      admin: {
        description: 'Electricity production in kWh',
      },
    },
    {
      name: 'energyConsumption',
      type: 'number',
      admin: {
        description: 'Electricity consumption in kWh',
      },
    },
    
    // Terrorism
    {
      name: 'terrorismNotes',
      type: 'textarea',
      admin: {
        description: 'Terrorism-related information',
      },
    },
    
    // World Heritage Sites
    {
      name: 'worldHeritageSites',
      type: 'textarea',
      admin: {
        description: 'UNESCO World Heritage Sites',
      },
    },
  ],
  indexes: [
    {
      fields: ['country'],
      unique: true,
    },
  ],
}