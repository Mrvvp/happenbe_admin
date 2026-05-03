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
    const viewbox = '75.65,11.50,76.00,11.10';
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
        return {
          name,
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          city: item.address.city || item.address.town || item.address.village || item.address.suburb || item.address.county || ''
        };
      })
      .filter((s: Suggestion) => isLatin(s.name));
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
};
