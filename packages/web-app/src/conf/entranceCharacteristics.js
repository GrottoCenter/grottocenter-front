// Boolean characteristic fields
// ENTRANCE_HAZARD_FIELDS: hazards/restrictions shown in a dedicated section.
// ENTRANCE_BOOLEAN_CHARACTERISTICS: all 9 fields (includes isTouristic).
export const ENTRANCE_HAZARD_FIELDS = [
  { field: 'hasBat', label: 'Bat habitat', icon: 'bat' },
  { field: 'dangerFlooding', label: 'Flooding risk', icon: 'flooding' },
  { field: 'dangerCo2', label: 'CO2 risk', icon: 'co2' },
  { field: 'dangerRockfall', label: 'Rockfall risk', icon: 'rockfall' },
  { field: 'dangerPollution', label: 'Pollution risk', icon: 'pollution' },
  { field: 'needCleanGear', label: 'Clean gear required', icon: 'clean_gear' },
  { field: 'needStayOnTrail', label: 'Stay on trail', icon: 'stay_on_trail' },
  { field: 'hasRules', label: 'Entry rules', icon: 'rules' }
];

export const ENTRANCE_BOOLEAN_CHARACTERISTICS = [
  ...ENTRANCE_HAZARD_FIELDS,
  { field: 'isTouristic', label: 'Touristic site', icon: 'touristic' }
];
