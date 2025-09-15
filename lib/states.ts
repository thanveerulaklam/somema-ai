export interface State {
  code: string;
  name: string;
  countryCode: string;
}

export const states: State[] = [
  // United States
  { code: 'AL', name: 'Alabama', countryCode: 'US' },
  { code: 'AK', name: 'Alaska', countryCode: 'US' },
  { code: 'AZ', name: 'Arizona', countryCode: 'US' },
  { code: 'AR', name: 'Arkansas', countryCode: 'US' },
  { code: 'CA', name: 'California', countryCode: 'US' },
  { code: 'CO', name: 'Colorado', countryCode: 'US' },
  { code: 'CT', name: 'Connecticut', countryCode: 'US' },
  { code: 'DE', name: 'Delaware', countryCode: 'US' },
  { code: 'FL', name: 'Florida', countryCode: 'US' },
  { code: 'GA', name: 'Georgia', countryCode: 'US' },
  { code: 'HI', name: 'Hawaii', countryCode: 'US' },
  { code: 'ID', name: 'Idaho', countryCode: 'US' },
  { code: 'IL', name: 'Illinois', countryCode: 'US' },
  { code: 'IN', name: 'Indiana', countryCode: 'US' },
  { code: 'IA', name: 'Iowa', countryCode: 'US' },
  { code: 'KS', name: 'Kansas', countryCode: 'US' },
  { code: 'KY', name: 'Kentucky', countryCode: 'US' },
  { code: 'LA', name: 'Louisiana', countryCode: 'US' },
  { code: 'ME', name: 'Maine', countryCode: 'US' },
  { code: 'MD', name: 'Maryland', countryCode: 'US' },
  { code: 'MA', name: 'Massachusetts', countryCode: 'US' },
  { code: 'MI', name: 'Michigan', countryCode: 'US' },
  { code: 'MN', name: 'Minnesota', countryCode: 'US' },
  { code: 'MS', name: 'Mississippi', countryCode: 'US' },
  { code: 'MO', name: 'Missouri', countryCode: 'US' },
  { code: 'MT', name: 'Montana', countryCode: 'US' },
  { code: 'NE', name: 'Nebraska', countryCode: 'US' },
  { code: 'NV', name: 'Nevada', countryCode: 'US' },
  { code: 'NH', name: 'New Hampshire', countryCode: 'US' },
  { code: 'NJ', name: 'New Jersey', countryCode: 'US' },
  { code: 'NM', name: 'New Mexico', countryCode: 'US' },
  { code: 'NY', name: 'New York', countryCode: 'US' },
  { code: 'NC', name: 'North Carolina', countryCode: 'US' },
  { code: 'ND', name: 'North Dakota', countryCode: 'US' },
  { code: 'OH', name: 'Ohio', countryCode: 'US' },
  { code: 'OK', name: 'Oklahoma', countryCode: 'US' },
  { code: 'OR', name: 'Oregon', countryCode: 'US' },
  { code: 'PA', name: 'Pennsylvania', countryCode: 'US' },
  { code: 'RI', name: 'Rhode Island', countryCode: 'US' },
  { code: 'SC', name: 'South Carolina', countryCode: 'US' },
  { code: 'SD', name: 'South Dakota', countryCode: 'US' },
  { code: 'TN', name: 'Tennessee', countryCode: 'US' },
  { code: 'TX', name: 'Texas', countryCode: 'US' },
  { code: 'UT', name: 'Utah', countryCode: 'US' },
  { code: 'VT', name: 'Vermont', countryCode: 'US' },
  { code: 'VA', name: 'Virginia', countryCode: 'US' },
  { code: 'WA', name: 'Washington', countryCode: 'US' },
  { code: 'WV', name: 'West Virginia', countryCode: 'US' },
  { code: 'WI', name: 'Wisconsin', countryCode: 'US' },
  { code: 'WY', name: 'Wyoming', countryCode: 'US' },

  // Canada
  { code: 'AB', name: 'Alberta', countryCode: 'CA' },
  { code: 'BC', name: 'British Columbia', countryCode: 'CA' },
  { code: 'MB', name: 'Manitoba', countryCode: 'CA' },
  { code: 'NB', name: 'New Brunswick', countryCode: 'CA' },
  { code: 'NL', name: 'Newfoundland and Labrador', countryCode: 'CA' },
  { code: 'NS', name: 'Nova Scotia', countryCode: 'CA' },
  { code: 'NT', name: 'Northwest Territories', countryCode: 'CA' },
  { code: 'NU', name: 'Nunavut', countryCode: 'CA' },
  { code: 'ON', name: 'Ontario', countryCode: 'CA' },
  { code: 'PE', name: 'Prince Edward Island', countryCode: 'CA' },
  { code: 'QC', name: 'Quebec', countryCode: 'CA' },
  { code: 'SK', name: 'Saskatchewan', countryCode: 'CA' },
  { code: 'YT', name: 'Yukon', countryCode: 'CA' },

  // India
  { code: 'AN', name: 'Andaman and Nicobar Islands', countryCode: 'IN' },
  { code: 'AP', name: 'Andhra Pradesh', countryCode: 'IN' },
  { code: 'AR', name: 'Arunachal Pradesh', countryCode: 'IN' },
  { code: 'AS', name: 'Assam', countryCode: 'IN' },
  { code: 'BR', name: 'Bihar', countryCode: 'IN' },
  { code: 'CH', name: 'Chandigarh', countryCode: 'IN' },
  { code: 'CT', name: 'Chhattisgarh', countryCode: 'IN' },
  { code: 'DL', name: 'Delhi', countryCode: 'IN' },
  { code: 'GA', name: 'Goa', countryCode: 'IN' },
  { code: 'GJ', name: 'Gujarat', countryCode: 'IN' },
  { code: 'HR', name: 'Haryana', countryCode: 'IN' },
  { code: 'HP', name: 'Himachal Pradesh', countryCode: 'IN' },
  { code: 'JK', name: 'Jammu and Kashmir', countryCode: 'IN' },
  { code: 'JH', name: 'Jharkhand', countryCode: 'IN' },
  { code: 'KA', name: 'Karnataka', countryCode: 'IN' },
  { code: 'KL', name: 'Kerala', countryCode: 'IN' },
  { code: 'MP', name: 'Madhya Pradesh', countryCode: 'IN' },
  { code: 'MH', name: 'Maharashtra', countryCode: 'IN' },
  { code: 'MN', name: 'Manipur', countryCode: 'IN' },
  { code: 'ML', name: 'Meghalaya', countryCode: 'IN' },
  { code: 'MZ', name: 'Mizoram', countryCode: 'IN' },
  { code: 'NL', name: 'Nagaland', countryCode: 'IN' },
  { code: 'OR', name: 'Odisha', countryCode: 'IN' },
  { code: 'PY', name: 'Puducherry', countryCode: 'IN' },
  { code: 'PB', name: 'Punjab', countryCode: 'IN' },
  { code: 'RJ', name: 'Rajasthan', countryCode: 'IN' },
  { code: 'SK', name: 'Sikkim', countryCode: 'IN' },
  { code: 'TN', name: 'Tamil Nadu', countryCode: 'IN' },
  { code: 'TG', name: 'Telangana', countryCode: 'IN' },
  { code: 'TR', name: 'Tripura', countryCode: 'IN' },
  { code: 'UP', name: 'Uttar Pradesh', countryCode: 'IN' },
  { code: 'UT', name: 'Uttarakhand', countryCode: 'IN' },
  { code: 'WB', name: 'West Bengal', countryCode: 'IN' },

  // Australia
  { code: 'ACT', name: 'Australian Capital Territory', countryCode: 'AU' },
  { code: 'NSW', name: 'New South Wales', countryCode: 'AU' },
  { code: 'NT', name: 'Northern Territory', countryCode: 'AU' },
  { code: 'QLD', name: 'Queensland', countryCode: 'AU' },
  { code: 'SA', name: 'South Australia', countryCode: 'AU' },
  { code: 'TAS', name: 'Tasmania', countryCode: 'AU' },
  { code: 'VIC', name: 'Victoria', countryCode: 'AU' },
  { code: 'WA', name: 'Western Australia', countryCode: 'AU' },

  // United Kingdom
  { code: 'ENG', name: 'England', countryCode: 'GB' },
  { code: 'SCT', name: 'Scotland', countryCode: 'GB' },
  { code: 'WLS', name: 'Wales', countryCode: 'GB' },
  { code: 'NIR', name: 'Northern Ireland', countryCode: 'GB' },

  // Germany
  { code: 'BW', name: 'Baden-Württemberg', countryCode: 'DE' },
  { code: 'BY', name: 'Bavaria', countryCode: 'DE' },
  { code: 'BE', name: 'Berlin', countryCode: 'DE' },
  { code: 'BB', name: 'Brandenburg', countryCode: 'DE' },
  { code: 'HB', name: 'Bremen', countryCode: 'DE' },
  { code: 'HH', name: 'Hamburg', countryCode: 'DE' },
  { code: 'HE', name: 'Hesse', countryCode: 'DE' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern', countryCode: 'DE' },
  { code: 'NI', name: 'Lower Saxony', countryCode: 'DE' },
  { code: 'NW', name: 'North Rhine-Westphalia', countryCode: 'DE' },
  { code: 'RP', name: 'Rhineland-Palatinate', countryCode: 'DE' },
  { code: 'SL', name: 'Saarland', countryCode: 'DE' },
  { code: 'SN', name: 'Saxony', countryCode: 'DE' },
  { code: 'ST', name: 'Saxony-Anhalt', countryCode: 'DE' },
  { code: 'SH', name: 'Schleswig-Holstein', countryCode: 'DE' },
  { code: 'TH', name: 'Thuringia', countryCode: 'DE' }
];

// Get states for a specific country
export const getStatesByCountry = (countryCode: string): State[] => {
  return states.filter(state => state.countryCode === countryCode);
};

// Get state by name and country
export const getStateByName = (name: string, countryCode: string): State | undefined => {
  return states.find(state => state.name === name && state.countryCode === countryCode);
};
