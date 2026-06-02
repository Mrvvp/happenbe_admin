export interface Suggestion {
  name: string;
  fullName: string;
  lat: number;
  lng: number;
  city: string;
}

// Strip '/admin' suffix to get the base /api path
const _rawBase = import.meta.env.VITE_API_BASE as string || 'http://localhost:5000/api/admin';
const API_BASE = _rawBase.endsWith('/admin') ? _rawBase.slice(0, -6) : _rawBase;

export const fetchSuggestions = async (query: string): Promise<Suggestion[]> => {
  if (!query || query.length < 1) return [];

  try {
    const url = `${API_BASE}/places/autocomplete?input=${encodeURIComponent(query)}&types=establishment|geocode`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Places request failed');
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(data.error_message || data.status);
    }

    const predictions: any[] = data.predictions || [];

    const suggestions = await Promise.all(
      predictions.slice(0, 6).map(async (p: any) => {
        const name: string = p.structured_formatting?.main_text || p.description.split(',')[0];
        const secondary: string = p.structured_formatting?.secondary_text || '';
        const city: string = secondary.split(',')[0]?.trim() || '';
        try {
          const dr = await fetch(`${API_BASE}/places/details?place_id=${p.place_id}`);
          const dd = await dr.json();
          const loc = dd.result?.geometry?.location;
          if (loc) return { name, city, lat: loc.lat as number, lng: loc.lng as number, fullName: p.description };
        } catch { /* silent */ }
        return null;
      })
    );

    return suggestions.filter(Boolean) as Suggestion[];
  } catch (error) {
    console.error('Google Places error:', error);
    return [];
  }
};
