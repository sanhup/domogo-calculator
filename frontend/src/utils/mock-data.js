/**
 * Mock data for development and testing
 * Structure: Lead → Advisory → Version
 */

export const mockCustomers = [
  {
    id: '1',
    name: 'Jan de Vries',
    email: 'jan@example.com',
    phone: '06-12345678',
    address: 'Hoofdstraat 123',
    postalCode: '1234AB',
    city: 'Amsterdam',
    createdAt: '2024-01-15',
    lastActivity: '2024-03-20',
    advisoryCount: 2
  },
  {
    id: '2',
    name: 'Maria Jansen',
    email: 'maria.jansen@example.com',
    phone: '06-23456789',
    address: 'Kerkstraat 45',
    postalCode: '2345BC',
    city: 'Rotterdam',
    createdAt: '2024-02-01',
    lastActivity: '2024-03-18',
    advisoryCount: 1
  },
  {
    id: '3',
    name: 'Pieter Bakker',
    email: 'p.bakker@example.com',
    phone: '06-34567890',
    address: 'Dorpsweg 67',
    postalCode: '3456CD',
    city: 'Utrecht',
    createdAt: '2024-02-10',
    lastActivity: '2024-03-15',
    advisoryCount: 1
  },
  {
    id: '4',
    name: 'Sophie van der Berg',
    email: 'sophie@example.com',
    phone: '06-45678901',
    address: 'Molenlaan 89',
    postalCode: '4567DE',
    city: 'Den Haag',
    createdAt: '2024-02-20',
    lastActivity: '2024-03-22',
    advisoryCount: 2
  },
  {
    id: '5',
    name: 'Thomas Visser',
    email: 'thomas.v@example.com',
    phone: '06-56789012',
    address: 'Schoolstraat 12',
    postalCode: '5678EF',
    city: 'Eindhoven',
    createdAt: '2024-03-01',
    lastActivity: '2024-03-10',
    advisoryCount: 1
  }
];

// Advisories grouped by customerId
export const mockAdvisories = {
  '1': [ // Jan de Vries
    {
      id: 'a1',
      customerId: '1',
      name: 'Initial consultation - Jan 2024',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      status: 'approved',
      versionCount: 2
    },
    {
      id: 'a2',
      customerId: '1',
      name: 'Follow-up consultation - Mar 2024',
      createdAt: '2024-03-20',
      updatedAt: '2024-03-20',
      status: 'sent',
      versionCount: 1
    }
  ],
  '2': [ // Maria Jansen
    {
      id: 'a3',
      customerId: '2',
      name: 'Battery system advisory - Feb 2024',
      createdAt: '2024-02-01',
      updatedAt: '2024-03-18',
      status: 'sent',
      versionCount: 2
    }
  ],
  '3': [ // Pieter Bakker
    {
      id: 'a4',
      customerId: '3',
      name: 'Initial consultation - Feb 2024',
      createdAt: '2024-02-10',
      updatedAt: '2024-03-15',
      status: 'draft',
      versionCount: 1
    }
  ],
  '4': [ // Sophie van der Berg
    {
      id: 'a5',
      customerId: '4',
      name: 'Comparison advisory - Feb 2024',
      createdAt: '2024-02-20',
      updatedAt: '2024-03-01',
      status: 'approved',
      versionCount: 3
    },
    {
      id: 'a6',
      customerId: '4',
      name: 'Updated financing options - Mar 2024',
      createdAt: '2024-03-22',
      updatedAt: '2024-03-22',
      status: 'draft',
      versionCount: 1
    }
  ],
  '5': [ // Thomas Visser
    {
      id: 'a7',
      customerId: '5',
      name: 'Initial consultation - Mar 2024',
      createdAt: '2024-03-01',
      updatedAt: '2024-03-10',
      status: 'sent',
      versionCount: 1
    }
  ]
};

// Versions grouped by advisoryId
export const mockVersions = {
  'a1': [ // Jan de Vries - Initial consultation
    {
      id: 'v1',
      advisoryId: 'a1',
      name: 'Tesla Powerwall 2 - Standard',
      status: 'approved',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      product: 'Tesla Powerwall 2',
      capacity: '13.5 kWh',
      roi: '8.2%',
      paybackYears: 12.2
    },
    {
      id: 'v2',
      advisoryId: 'a1',
      name: 'Sonnen Battery - Alternative',
      status: 'draft',
      createdAt: '2024-01-16',
      updatedAt: '2024-01-18',
      product: 'Sonnen Battery 10',
      capacity: '11 kWh',
      roi: '7.8%',
      paybackYears: 12.8
    }
  ],
  'a2': [ // Jan de Vries - Follow-up
    {
      id: 'v3',
      advisoryId: 'a2',
      name: 'Tesla Powerwall 3 - Latest model',
      status: 'sent',
      createdAt: '2024-03-20',
      updatedAt: '2024-03-20',
      product: 'Tesla Powerwall 3',
      capacity: '13.5 kWh',
      roi: '9.1%',
      paybackYears: 11.0
    }
  ],
  'a3': [ // Maria Jansen
    {
      id: 'v4',
      advisoryId: 'a3',
      name: 'Huawei LUNA2000 - Initial',
      status: 'approved',
      createdAt: '2024-02-01',
      updatedAt: '2024-02-05',
      product: 'Huawei LUNA2000',
      capacity: '10 kWh',
      roi: '8.5%',
      paybackYears: 11.8
    },
    {
      id: 'v5',
      advisoryId: 'a3',
      name: 'Huawei LUNA2000 - Updated pricing',
      status: 'sent',
      createdAt: '2024-03-18',
      updatedAt: '2024-03-18',
      product: 'Huawei LUNA2000',
      capacity: '10 kWh',
      roi: '9.0%',
      paybackYears: 11.1
    }
  ],
  'a4': [ // Pieter Bakker
    {
      id: 'v6',
      advisoryId: 'a4',
      name: 'BYD Battery-Box Premium',
      status: 'draft',
      createdAt: '2024-02-10',
      updatedAt: '2024-03-15',
      product: 'BYD Battery-Box Premium',
      capacity: '12.8 kWh',
      roi: '7.5%',
      paybackYears: 13.3
    }
  ],
  'a5': [ // Sophie van der Berg - Comparison
    {
      id: 'v7',
      advisoryId: 'a5',
      name: 'Tesla Powerwall 2 - Standard',
      status: 'invalid',
      createdAt: '2024-02-20',
      updatedAt: '2024-02-25',
      product: 'Tesla Powerwall 2',
      capacity: '13.5 kWh',
      roi: '8.0%',
      paybackYears: 12.5
    },
    {
      id: 'v8',
      advisoryId: 'a5',
      name: 'Tesla Powerwall 3 - Premium',
      status: 'approved',
      createdAt: '2024-02-21',
      updatedAt: '2024-03-01',
      product: 'Tesla Powerwall 3',
      capacity: '13.5 kWh',
      roi: '9.5%',
      paybackYears: 10.5
    },
    {
      id: 'v9',
      advisoryId: 'a5',
      name: 'Pylontech - Budget option',
      status: 'sent',
      createdAt: '2024-02-22',
      updatedAt: '2024-02-28',
      product: 'Pylontech US3000C',
      capacity: '7.2 kWh',
      roi: '6.8%',
      paybackYears: 14.7
    }
  ],
  'a6': [ // Sophie van der Berg - Updated financing
    {
      id: 'v10',
      advisoryId: 'a6',
      name: 'Tesla Powerwall 3 - New financing',
      status: 'draft',
      createdAt: '2024-03-22',
      updatedAt: '2024-03-22',
      product: 'Tesla Powerwall 3',
      capacity: '13.5 kWh',
      roi: '9.8%',
      paybackYears: 10.2
    }
  ],
  'a7': [ // Thomas Visser
    {
      id: 'v11',
      advisoryId: 'a7',
      name: 'Sonnen Battery 10',
      status: 'sent',
      createdAt: '2024-03-01',
      updatedAt: '2024-03-10',
      product: 'Sonnen Battery 10',
      capacity: '11 kWh',
      roi: '8.3%',
      paybackYears: 12.0
    }
  ]
};

// Helper functions
export function getCustomerById(id) {
  return mockCustomers.find(c => c.id === id);
}

export function getAdvisoriesByCustomerId(customerId) {
  return mockAdvisories[customerId] || [];
}

export function getAdvisoryById(advisoryId) {
  for (const advisories of Object.values(mockAdvisories)) {
    const advisory = advisories.find(a => a.id === advisoryId);
    if (advisory) return advisory;
  }
  return null;
}

export function getVersionsByAdvisoryId(advisoryId) {
  return mockVersions[advisoryId] || [];
}

export function getVersionById(versionId) {
  for (const versions of Object.values(mockVersions)) {
    const version = versions.find(v => v.id === versionId);
    if (version) return version;
  }
  return null;
}
