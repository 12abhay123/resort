import { useCallback, useEffect, useState } from 'react';
import { Coffee, Compass, ExternalLink, Landmark, MapPin, MapPinned, Navigation, RefreshCw, Utensils, Trees, Building2 } from 'lucide-react';

const RADIUS_METERS = 10000;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const CATEGORY_META = {
  Attraction: { icon: Landmark, color: 'bg-[#fff4df] text-[#9b681f]' },
  Park: { icon: Trees, color: 'bg-brand-50 text-brand-700' },
  Museum: { icon: Building2, color: 'bg-[#f1ecff] text-[#6653a6]' },
  Temple: { icon: Landmark, color: 'bg-[#fbf0ed] text-[#a84f3b]' },
  Restaurant: { icon: Utensils, color: 'bg-[#fff4df] text-[#9b681f]' },
  Cafe: { icon: Coffee, color: 'bg-[#f4eee7] text-[#765b43]' },
  Entertainment: { icon: Compass, color: 'bg-[#eaf4f2] text-brand-700' },
};

function getCategory(tags = {}) {
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') return 'Museum';
  if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint' || tags.tourism === 'zoo' || tags.tourism === 'theme_park') return 'Attraction';
  if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve' || tags.leisure === 'water_park') return 'Park';
  if (tags.amenity === 'place_of_worship' || tags.religion) return 'Temple';
  if (tags.amenity === 'restaurant') return 'Restaurant';
  if (tags.amenity === 'cafe') return 'Cafe';
  return 'Entertainment';
}

function distanceInKm(from, to) {
  const earthRadius = 6371;
  const latitudeDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const longitudeDelta = ((to.lon - from.lon) * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizePlaces(elements, location) {
  const seen = new Set();
  return elements.map((element) => {
    const tags = element.tags || {};
    const coordinates = element.center || element;
    const name = tags.name || tags['name:en'];
    if (!name || !coordinates?.lat || !coordinates?.lon) return null;
    const key = `${name}-${coordinates.lat}-${coordinates.lon}`;
    if (seen.has(key)) return null;
    seen.add(key);
    return {
      id: element.id,
      name,
      category: getCategory(tags),
      lat: coordinates.lat,
      lon: coordinates.lon,
      distance: distanceInKm(location, coordinates),
      address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
      info: tags.description || tags.cuisine || tags.opening_hours || tags.website || '',
      website: tags.website || tags['contact:website'],
    };
  }).filter(Boolean).sort((a, b) => a.distance - b.distance).slice(0, 36);
}

function overpassQuery(latitude, longitude) {
  const around = `(around:${RADIUS_METERS},${latitude},${longitude})`;
  return `[out:json][timeout:25];(${[
    `nwr["tourism"~"attraction|museum|theme_park|zoo|gallery|viewpoint"]${around};`,
    `nwr["leisure"~"park|nature_reserve|garden|water_park"]${around};`,
    `nwr["amenity"~"restaurant|cafe|place_of_worship|cinema|theatre"]${around};`,
  ].join('')});out center tags;`;
}

function formatDistance(distance) {
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`;
}

export default function NearbyPlaces() {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('Reading your current area...');
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState('locating');
  const [error, setError] = useState('');

  const findPlaces = useCallback(async (coordinates) => {
    setStatus('loading');
    setError('');
    const query = overpassQuery(coordinates.latitude, coordinates.longitude);
    let lastError;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Nearby places service is busy');
        const data = await response.json();
        const found = normalizePlaces(data.elements || [], { lat: coordinates.latitude, lon: coordinates.longitude });
        setPlaces(found);
        setStatus(found.length ? 'ready' : 'empty');
        return;
      } catch (requestError) {
        lastError = requestError;
      }
    }
    setStatus('error');
    setError(lastError?.message || 'Nearby places could not be loaded right now.');
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      setError('This browser does not support location detection.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setLocationName('Reading your current area...');
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
          .then((response) => response.ok ? response.json() : null)
          .then((data) => setLocationName(data?.display_name || 'Area identified from your coordinates'))
          .catch(() => setLocationName('Area identified from your coordinates'));
        findPlaces(position.coords);
      },
      (geoError) => {
        setStatus(geoError.code === 1 ? 'denied' : 'error');
        setError(geoError.code === 1 ? 'Location permission was denied. Allow location access in your browser to discover nearby places.' : 'Your location could not be detected. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );
  }, [findPlaces]);

  useEffect(() => { locate(); }, [locate]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[26px] bg-[#17312f] p-6 text-white sm:p-9">
        <div className="absolute right-[-30px] top-[-55px] h-52 w-52 rounded-full border-[26px] border-white/10" />
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 text-white/75"><MapPinned size={17} /><p className="text-[10px] font-bold uppercase tracking-[0.16em]">OpenStreetMap discovery</p></div>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Places worth stepping out for.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Discover attractions, parks, museums, temples, food and entertainment within 10 km of your current location.</p>
          <button type="button" onClick={locate} disabled={status === 'locating' || status === 'loading'} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#17312f] disabled:opacity-60"><RefreshCw size={16} className={status === 'locating' || status === 'loading' ? 'animate-spin' : ''} /> Update my location</button>
        </div>
      </section>

      {location && status === 'ready' && <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"><MapPin size={14} /> Showing the nearest places first within 10 km</p>}

      {location && (
        <div className="card flex flex-col gap-3 border-brand-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><MapPin size={18} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">Your current location</p>
              <p className="mt-1 max-w-2xl text-sm font-semibold text-ink-900">{locationName}</p>
              <p className="mt-1 text-xs text-ink-700/60">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)} · Source: Browser Geolocation API</p>
            </div>
          </div>
          <p className="text-xs text-ink-700/55 sm:max-w-[190px] sm:text-right">Location is used only to find nearby places around you.</p>
        </div>
      )}

      {['denied', 'unsupported', 'error'].includes(status) && (
        <div className="card flex flex-col gap-4 border-coral/20 bg-[#fbf0ed] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold text-[#8d4636]">We could not find your location</p><p className="mt-1 text-sm text-[#8d4636]/75">{error}</p></div>
          <button type="button" onClick={locate} className="btn-secondary shrink-0"><Navigation size={15} /> Try again</button>
        </div>
      )}

      {status === 'empty' && <div className="card p-8 text-center"><Compass size={28} className="mx-auto text-brand-600" /><p className="mt-3 font-semibold text-ink-900">No named places found nearby</p><p className="mt-1 text-sm text-ink-700/60">Try updating your location or explore a wider area later.</p></div>}
      {(status === 'locating' || status === 'loading') && <div className="card p-8 text-center"><RefreshCw size={25} className="mx-auto animate-spin text-brand-600" /><p className="mt-3 font-semibold text-ink-900">Finding nearby places...</p><p className="mt-1 text-sm text-ink-700/60">Reading your location and searching OpenStreetMap.</p></div>}

      {status === 'ready' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => {
            const meta = CATEGORY_META[place.category] || CATEGORY_META.Attraction;
            const Icon = meta.icon;
            const navigateUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${location.latitude},${location.longitude};${place.lat},${place.lon}`;
            return (
              <article key={`${place.id}-${place.lat}`} className="card group flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3 bg-ivory p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meta.color}`}><Icon size={21} /></div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-ink-700 shadow-sm">{formatDistance(place.distance)}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">{place.category}</span><span className="h-1 w-1 rounded-full bg-sand" /></div>
                  <h3 className="mt-2 text-lg font-bold text-ink-900">{place.name}</h3>
                  {place.address && <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-ink-700/65"><MapPin size={13} className="mt-0.5 shrink-0 text-brand-600" /> {place.address}</p>}
                  {place.info && <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-700/65">{place.info}</p>}
                  <div className="mt-auto flex gap-2 pt-5">
                    <a href={navigateUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 py-2 text-xs"><Navigation size={14} /> Navigate</a>
                    {place.website && <a href={place.website} target="_blank" rel="noreferrer" aria-label={`Open ${place.name} website`} className="btn-secondary px-3 py-2"><ExternalLink size={14} /></a>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-ink-700/50">Place data © OpenStreetMap contributors · Search powered by Overpass API</p>
    </div>
  );
}
