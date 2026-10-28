export type Place = 'athens' | 'eleusis' | 'eleutherae' | 'thebes' | 'megara' | 'isthmus' | 'corinth' | 'mycenae' | 'argos' | 'tegea' | 'sparta';

export interface PlaceSpec {
  name: string;
  lon: number;
  lat: number;
}

export const PLACES: Record<Place, PlaceSpec> = {
  athens: { name: 'Athens', lon: 23.7275, lat: 37.9715 },
  eleusis: { name: 'Eleusis', lon: 23.5383, lat: 38.0412 },
  eleutherae: { name: 'Eleutherae', lon: 23.3735, lat: 38.1806 },
  thebes: { name: 'Thebes', lon: 23.3192, lat: 38.3209 },
  megara: { name: 'Megara', lon: 23.3447, lat: 37.9958 },
  isthmus: { name: 'Isthmus', lon: 22.993, lat: 37.916 },
  corinth: { name: 'Corinth', lon: 22.88, lat: 37.906 },
  mycenae: { name: 'Mycenae', lon: 22.756, lat: 37.731 },
  argos: { name: 'Argos', lon: 22.724, lat: 37.631 },
  tegea: { name: 'Tegea', lon: 22.419, lat: 37.456 },
  sparta: { name: 'Sparta', lon: 22.43, lat: 37.081 },
};

const EARTH_RADIUS_KM = 6371;

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function kmBetween(a: PlaceSpec, b: PlaceSpec): number {
  const dLat = radians(b.lat - a.lat);
  const dLon = radians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function roadKm(road: Place[]): number {
  return road.slice(1).reduce((km, place, i) => km + kmBetween(PLACES[road[i]], PLACES[place]), 0);
}
