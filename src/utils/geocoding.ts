export interface Suggestion {
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  city: string;
}

export const fetchSuggestions = async (query: string): Promise<Suggestion[]> => {
  if (!query || query.length < 2) return [];

  try {
    const viewbox = '74.85,12.80,77.40,8.20';
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&viewbox=${viewbox}&addressdetails=1&accept-language=en`,
      { headers: { 'Accept-Language': 'en' } }
    );

    if (!response.ok) throw new Error('Suggestions request failed');

    const isLatin = (str: string) => /^[ -ɏ\s\d.,()'\-/&]+$/.test(str);

    const data = await response.json();
    return data
      .map((item: any) => {
        const firstName = item.display_name.split(',')[0].trim();
        const name = item.namedetails?.['name:en'] || firstName;
        const a = item.address || {};

        let city: string = a.city || a.town || a.municipality || '';

        if (!city) {
          const dn: string = item.display_name || '';
          if (/kozhikode/i.test(dn) || /calicut/i.test(dn)) city = 'Kozhikode';
        }

        if (!city) {
          city = a.city_district || a.district || a.county || '';
        }

        return {
          name,
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          city
        };
      })
      .filter((s: Suggestion) => isLatin(s.name));
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
};
