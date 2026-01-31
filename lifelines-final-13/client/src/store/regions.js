export const REGIONS = [
  { id: 'doha', name: 'Doha', center: { lat: 25.2854, lng: 51.5310 } },
  { id: 'lusail', name: 'Lusail', center: { lat: 25.4201, lng: 51.4906 } },
  { id: 'al-rayyan', name: 'Al Rayyan', center: { lat: 25.2916, lng: 51.4244 } },
  { id: 'al-wakrah', name: 'Al Wakrah', center: { lat: 25.1715, lng: 51.6034 } },
  { id: 'al-khor', name: 'Al Khor', center: { lat: 25.6840, lng: 51.5050 } },
  { id: 'other', name: 'Other / Custom', center: { lat: 25.2854, lng: 51.5310 } }
];

export function regionById(id) {
  return REGIONS.find(r => r.id === id) || REGIONS[0];
}

export function normalizeRegion(input) {
  if (!input) return regionById('doha');
  const byId = REGIONS.find(r => r.id === input);
  if (byId) return byId;
  const byName = REGIONS.find(r => r.name.toLowerCase() === String(input).toLowerCase());
  if (byName) return byName;
  return { id: 'custom', name: String(input), center: REGIONS[0].center };
}
