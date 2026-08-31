// Open-Meteo: free, no API key — fits the self-hosted philosophy (no vendor account to sign up for).
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO weather codes collapsed into a few Font Awesome icons — good enough for a small dashboard badge.
const ICON_BY_CODE = {
    0: 'fa-sun', 1: 'fa-sun', 2: 'fa-cloud-sun', 3: 'fa-cloud',
    45: 'fa-smog', 48: 'fa-smog',
    51: 'fa-cloud-rain', 53: 'fa-cloud-rain', 55: 'fa-cloud-rain',
    61: 'fa-cloud-showers-heavy', 63: 'fa-cloud-showers-heavy', 65: 'fa-cloud-showers-heavy',
    71: 'fa-snowflake', 73: 'fa-snowflake', 75: 'fa-snowflake', 77: 'fa-snowflake',
    80: 'fa-cloud-rain', 81: 'fa-cloud-showers-heavy', 82: 'fa-cloud-showers-heavy',
    85: 'fa-snowflake', 86: 'fa-snowflake',
    95: 'fa-cloud-bolt', 96: 'fa-cloud-bolt', 99: 'fa-cloud-bolt'
};

function iconFor(code) {
    return ICON_BY_CODE[code] || 'fa-cloud';
}

async function geocodeLocation(name) {
    try {
        const url = `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=1`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return null;
        const data = await response.json();
        const match = data.results && data.results[0];
        if (!match) return null;
        return { lat: match.latitude, lon: match.longitude, label: [match.name, match.country].filter(Boolean).join(', ') };
    } catch (err) {
        return null;
    }
}

// In-memory only — a single-user self-hosted dashboard doesn't need this surviving a restart,
// and it keeps every dashboard page load from re-hitting the API.
const cache = new Map();
const CACHE_TTL_MS = 20 * 60 * 1000;

async function getCurrentWeather(lat, lon) {
    const key = `${lat},${lon}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;

    try {
        const url = `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return cached ? cached.data : null;
        const data = await response.json();
        if (!data.current) return cached ? cached.data : null;

        const result = { temperature: Math.round(data.current.temperature_2m), icon: iconFor(data.current.weather_code) };
        cache.set(key, { at: Date.now(), data: result });
        return result;
    } catch (err) {
        return cached ? cached.data : null;
    }
}

module.exports = { geocodeLocation, getCurrentWeather };
