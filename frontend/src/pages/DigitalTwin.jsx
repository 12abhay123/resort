import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, CloudRain, RefreshCw, ShieldAlert, Wind } from 'lucide-react';
import api from '../api/axios';

const CONTROLS = [
  { key: 'rainfallMm24h', label: 'Rainfall', unit: 'mm / 24h', min: 0, max: 300, step: 5 },
  { key: 'temperatureC', label: 'Temperature', unit: 'deg C', min: 0, max: 48, step: 1 },
  { key: 'stormDurationHours', label: 'Storm duration', unit: 'hours', min: 0, max: 24, step: 1 },
  { key: 'windKph', label: 'Peak wind', unit: 'km/h', min: 0, max: 180, step: 5 },
  { key: 'floodDepthCm', label: 'Flood depth', unit: 'cm', min: 0, max: 200, step: 5 },
];

function weatherDescription(code) {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}

function MapView({ data, simulation }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!mapElement.current) return undefined;
    const map = L.map(mapElement.current, { scrollWheelZoom: false }).setView([15.2993, 74.124], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    window.requestAnimationFrame(() => map.invalidateSize());
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!data || !mapRef.current || !layerRef.current) return;
    const map = mapRef.current;
    const layers = layerRef.current;
    layers.clearLayers();
    const center = [data.location.latitude, data.location.longitude];
    map.setView(center, 14);
    const severity = simulation.riskIndex >= 0.48 ? '#c04f3c' : simulation.riskIndex >= 0.2 ? '#d59136' : '#27847a';
    L.circle(center, {
      radius: 280 + simulation.scenario.floodDepthCm * 16 + simulation.riskIndex * 900,
      color: severity,
      fillColor: severity,
      fillOpacity: 0.16,
      weight: 2,
    }).addTo(layers);
    const sites = data.mapSites || [];
    sites.forEach((site, index) => {
      const point = [site.latitude, site.longitude];
      if (index > 0) L.polyline([center, point], { color: severity, weight: 2, opacity: 0.55, dashArray: '5 7' }).addTo(layers);
      L.circleMarker(point, {
        radius: index === 0 ? 9 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: index === 0 ? '#17312f' : severity,
        fillOpacity: 1,
      }).bindTooltip(site.name, { direction: 'top' }).addTo(layers);
    });
  }, [data, simulation]);

  return <div ref={mapElement} className="h-[360px] w-full overflow-hidden rounded-md bg-[#e8eee8] sm:h-[440px]" aria-label="Interactive map of resort weather impacts" />;
}

function Metric({ label, value, detail, tone = 'text-ink-900' }) {
  return (
    <div className="border-l-2 border-sand/80 pl-3">
      <p className="text-[10px] font-bold uppercase text-ink-700/55">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-ink-700/65">{detail}</p>
    </div>
  );
}

export default function DigitalTwin() {
  const [data, setData] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  async function refreshSnapshot() {
    setError('');
    try {
      const response = await api.get('/digital-twin/snapshot');
      setData(response.data);
      setScenario(response.data.defaultScenario);
      setSimulation(response.data.simulation);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Weather and resort data are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshSnapshot();
    const timer = window.setInterval(refreshSnapshot, 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function runScenario(event) {
    event.preventDefault();
    setRunning(true);
    setError('');
    try {
      const response = await api.post('/digital-twin/simulate', scenario);
      setSimulation(response.data.simulation);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The scenario could not be simulated.');
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <div className="card p-8 text-sm text-ink-700/70">Connecting live weather to resort operations...</div>;
  if (!data) return <div className="card border-coral/20 bg-[#fbf0ed] p-5 text-sm text-[#8d4636]">{error || 'Digital Twin data is unavailable.'}</div>;

  const riskColor = simulation.riskIndex >= 0.48 ? 'text-[#ad4635]' : simulation.riskIndex >= 0.2 ? 'text-[#a36b20]' : 'text-brand-700';

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-sand/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Operations intelligence / live weather</p>
          <h2 className="page-heading mt-1">Weather Digital Twin</h2>
          <p className="mt-2 text-sm text-ink-700/65">A virtual resort state for exploring weather impacts without changing live operations.</p>
        </div>
        <button type="button" onClick={refreshSnapshot} className="btn-secondary self-start sm:self-auto"><RefreshCw size={15} /> Refresh live data</button>
      </header>

      {data.location.isDemo && <p className="border-l-2 border-[#d59136] bg-[#fbf6e9] px-3 py-2 text-xs leading-5 text-ink-700">Demo map pin in use. Set RESORT_LOCATION_NAME, RESORT_LATITUDE and RESORT_LONGITUDE to your real property before relying on local weather.</p>}
      {error && <p role="alert" className="border-l-2 border-coral bg-[#fbf0ed] px-3 py-2 text-sm text-[#8d4636]">{error}</p>}

      <section className="grid gap-5 border-b border-sand/70 pb-6 md:grid-cols-[1.1fr_2fr]">
        <div className="bg-[#17312f] p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase text-white/65">Current conditions</p><p className="mt-2 text-3xl font-semibold">{Math.round(data.weather.current.temperatureC)} deg</p><p className="mt-1 text-sm text-white/75">{weatherDescription(data.weather.current.weatherCode)}</p></div>
            <CloudRain size={28} strokeWidth={1.5} className="text-[#e6c37c]" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4 text-xs text-white/80">
            <p><span className="block text-white/50">Humidity</span>{data.weather.current.humidityPercent}%</p>
            <p><span className="block text-white/50">Wind / gust</span>{data.weather.current.windKph} / {data.weather.current.windGustKph} km/h</p>
            <p><span className="block text-white/50">Rain now</span>{data.weather.current.rainfallMm} mm</p>
            <p><span className="block text-white/50">Peak rain chance</span>{data.weather.forecast.peakRainProbability}% next 24h</p>
          </div>
          <p className="mt-5 text-[10px] text-white/55">{data.weather.source} · updated {new Date(data.weather.fetchedAt).toLocaleTimeString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-6 border-y border-sand/70 py-5 sm:grid-cols-3 sm:gap-x-7">
          <Metric label="Occupancy baseline" value={`${data.context.baselineOccupancy.toFixed(1)}%`} detail={data.context.occupancySource} />
          <Metric label="Occupied rooms" value={`${data.context.occupiedRooms} / ${data.context.totalRooms}`} detail={`${data.context.confirmedBookingsNext7Days} upcoming bookings`} />
          <Metric label="Available staff" value={`${data.context.availableStaff} / ${data.context.totalStaff}`} detail={`${data.context.eventsNext7Days} events in 7 days`} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div><p className="eyebrow">Geospatial impact network</p><h3 className="mt-1 text-lg font-bold text-ink-900">{data.location.name}</h3></div>
            <p className="text-[10px] text-ink-700/55">Illustrative facility pins around the configured resort anchor</p>
          </div>
          <MapView data={data} simulation={simulation} />
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-ink-700/65">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#17312f]" /> Resort</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d59136]" /> Connected operation</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-coral bg-coral/20" /> Scenario exposure zone</span>
            <span>Map tiles &copy; OpenStreetMap</span>
          </div>
        </div>

        <form onSubmit={runScenario} className="border-t border-sand/70 pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          <div className="flex items-start justify-between gap-3">
            <div><p className="eyebrow">What-if laboratory</p><h3 className="mt-1 text-lg font-bold text-ink-900">Change the weather</h3></div>
            <Activity size={19} className="mt-1 text-brand-700" />
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-700/65">Start with the next 24-hour forecast, then test ordinary or extreme conditions.</p>
          <div className="mt-5 space-y-4">
            {CONTROLS.map((control) => (
              <label key={control.key} className="block">
                <span className="flex items-baseline justify-between gap-2 text-xs font-semibold text-ink-700"><span>{control.label}</span><span className="tabular-nums text-ink-900">{scenario[control.key]} {control.unit}</span></span>
                <input type="range" min={control.min} max={control.max} step={control.step} value={scenario[control.key]} onChange={(event) => setScenario({ ...scenario, [control.key]: Number(event.target.value) })} className="mt-2 h-2 w-full cursor-pointer accent-[#27847a]" aria-label={control.label} />
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="submit" disabled={running} className="btn-primary"><Activity size={15} /> {running ? 'Simulating...' : 'Run simulation'}</button>
            <button type="button" onClick={() => { setScenario(data.defaultScenario); setSimulation(data.simulation); }} className="btn-secondary">Reset forecast</button>
          </div>
          <p className="mt-4 border-l-2 border-brand-500 bg-brand-50/70 px-3 py-2 text-[11px] leading-5 text-brand-900">{data.safetyNote}</p>
        </form>
      </section>

      <section className="border-y border-sand/70 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Virtual scenario output</p><h3 className="mt-1 text-lg font-bold text-ink-900">Cascading operational effects</h3></div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold"><ShieldAlert size={15} className={riskColor} /><span className={riskColor}>{simulation.riskProbabilityPct}% disruption likelihood</span></div>
        </div>
        <p className="mt-1 text-[11px] text-ink-700/55">{simulation.probabilityNote} Occupancy interval is an uncertainty range, not a calibrated confidence interval.</p>
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 xl:grid-cols-6">
          <Metric label="Occupancy" value={`${simulation.occupancy.projectedPercent}%`} detail={`${simulation.occupancy.weatherDeltaPoints} pts · range ${simulation.occupancy.uncertaintyRangePercent.join('-')}%`} />
          <Metric label="Bookings" value={`${simulation.bookings.expectedChangePercent}%`} detail={`scenario change · range ${simulation.bookings.uncertaintyRangePercent.join(' to ')}%`} />
          <Metric label="Guest movement" value={`${simulation.guestMovement.indoorShiftPercent}%`} detail={`activity shifts indoors · outdoor access ${simulation.guestMovement.outdoorAccessRisk}`} />
          <Metric label="Restaurant" value={`${simulation.restaurant.expectedCoversChangePercent > 0 ? '+' : ''}${simulation.restaurant.expectedCoversChangePercent}%`} detail={`covers · ${simulation.restaurant.indoorDiningShiftPercent}% indoor dining shift`} />
          <Metric label="Staffing" value={`+${simulation.staffing.additionalStaffRecommended}`} detail={`${simulation.staffing.commuteAvailabilityRiskPercent}% commute availability risk`} />
          <Metric label="Resources" value={`+${simulation.resources.energyUseChangePercent}% energy`} detail={`supplies +${simulation.resources.supplyUseChangePercent}% · ${simulation.resources.inventoryAtRisk.length} low-stock items`} />
        </div>
        <div className="mt-6 grid gap-3 border-t border-sand/70 pt-4 md:grid-cols-[1.3fr_1fr]">
          <ol className="space-y-2 text-xs leading-5 text-ink-700/75">{simulation.impactChain.map((impact) => <li key={impact} className="flex gap-2"><span className="font-bold text-brand-700">&rarr;</span><span>{impact}</span></li>)}</ol>
          <div className="border-l-2 border-sand/80 pl-3 text-xs leading-5 text-ink-700/65"><p className="font-semibold text-ink-900">Operational context</p><p className="mt-1">{data.context.confirmedBookingsNext7Days} confirmed bookings and {data.context.eventsNext7Days} published events in the next 7 days.</p><p className="mt-1">At-risk inventory: {data.context.inventoryAtRisk.length ? data.context.inventoryAtRisk.join(', ') : 'none currently below reorder threshold'}.</p><p className="mt-2 inline-flex items-center gap-1.5"><Wind size={13} /> Occupancy baseline from {data.context.occupancySource}.</p></div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Public social listening</p><h3 className="mt-1 text-lg font-bold text-ink-900">Traveler signals</h3></div><span className="text-[10px] text-ink-700/55">{data.social.source}</span></div>
        <p className="mt-1 text-xs text-ink-700/60">{data.socialUseNote}</p>
        {data.social.posts.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{data.social.posts.slice(0, 4).map((post) => <article key={post.url} className="border-l-2 border-sand/80 py-1 pl-3"><p className="text-xs leading-5 text-ink-700">{post.text}</p><a href={post.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[10px] font-semibold text-brand-700">@{post.author} · public post</a></article>)}</div> : <p className="mt-3 text-xs text-ink-700/60">No matching public posts are available right now ({data.social.status}).</p>}
      </section>
      <p className="border-t border-sand/70 pt-4 text-[10px] leading-5 text-ink-700/55">Weather-driven formulas are explainable demo estimates, not a resort-trained weather model. Historical weather-linked booking and operations outcomes are required for calibration. Do not use this view for emergency decisions.</p>
    </div>
  );
}