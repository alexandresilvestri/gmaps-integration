// Renders a Google Maps JS map with the transit polyline returned by Directions API.

const { useEffect, useRef, useState } = React;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (window.__gmapsLibs) return window.__gmapsLibs;
  window.__gmapsLibs = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry,marker&v=weekly`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      if (window.google?.maps?.Map) resolve(window.google.maps);
      else reject(new Error('Google Maps SDK carregou sem google.maps.Map'));
    };
    s.onerror = () => reject(new Error('Falha ao carregar Google Maps JS'));
    document.head.appendChild(s);
  });
  return window.__gmapsLibs;
}

function MapView({ from, to, route, mode, apiKey }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef({ polylineHalo: null, polyline: null, markerA: null, markerB: null });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!apiKey) { setStatus('no-key'); return; }
    if (!route?.map?.polyline || !route?.map?.bounds) { setStatus('no-map'); return; }
    let cancelled = false;
    setStatus('loading');
    loadGoogleMaps(apiKey).then((lib) => {
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = new lib.Map(containerRef.current, {
          center: { lat: from.lat, lng: from.lng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
      }
      const map = mapRef.current;
      const path = lib.geometry.encoding.decodePath(route.map.polyline);

      clearOverlays(overlaysRef.current);
      overlaysRef.current.polylineHalo = new lib.Polyline({
        path,
        map,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: 9,
      });
      overlaysRef.current.polyline = new lib.Polyline({
        path,
        map,
        strokeColor: '#1f7a4d',
        strokeOpacity: 1,
        strokeWeight: 5,
      });
      overlaysRef.current.markerA = new lib.Marker({
        position: { lat: from.lat, lng: from.lng },
        map,
        label: { text: 'A', color: '#fff', fontWeight: '700', fontSize: '12px' },
        title: from.name,
      });
      overlaysRef.current.markerB = new lib.Marker({
        position: { lat: to.lat, lng: to.lng },
        map,
        label: { text: 'B', color: '#fff', fontWeight: '700', fontSize: '12px' },
        title: to.name,
      });

      const bounds = new lib.LatLngBounds(
        { lat: route.map.bounds.sw.lat, lng: route.map.bounds.sw.lng },
        { lat: route.map.bounds.ne.lat, lng: route.map.bounds.ne.lng },
      );
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      setStatus('ready');
    }).catch((err) => {
      if (cancelled) return;
      setErrorMsg(err.message || 'Erro ao carregar mapa');
      setStatus('error');
    });

    return () => { cancelled = true; };
  }, [apiKey, from?.id, to?.id, route?.map?.polyline]);

  useEffect(() => () => {
    clearOverlays(overlaysRef.current);
  }, []);

  return (
    <div style={mapStyles.wrap}>
      <div ref={containerRef} style={mapStyles.canvas} />
      {status !== 'ready' && (
        <div style={mapStyles.overlay}>
          <MapMessage status={status} errorMsg={errorMsg} source={route?.map?.source} />
        </div>
      )}
      <div style={mapStyles.modeBadge}>
        {transitIcon()} <span>Ônibus</span>
      </div>
    </div>
  );
}

function clearOverlays(o) {
  if (o.polylineHalo) { o.polylineHalo.setMap(null); o.polylineHalo = null; }
  if (o.polyline) { o.polyline.setMap(null); o.polyline = null; }
  if (o.markerA) { o.markerA.setMap(null); o.markerA = null; }
  if (o.markerB) { o.markerB.setMap(null); o.markerB = null; }
}

function MapMessage({ status, errorMsg, source }) {
  if (status === 'loading') return <div style={mapStyles.msg}>Carregando mapa…</div>;
  if (status === 'no-key') return <div style={mapStyles.msg}>Defina <code>GOOGLE_MAPS_JS_API_KEY</code> para visualizar o mapa.</div>;
  if (status === 'no-map') return <div style={mapStyles.msg}>Mapa indisponível para este trajeto.</div>;
  if (status === 'error') return <div style={mapStyles.msg}>Erro ao carregar mapa: {errorMsg}</div>;
  if (source === 'mock') return <div style={mapStyles.msg}>Trajeto aproximado (sem chave do servidor).</div>;
  return null;
}

function transitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="14" rx="2" />
      <path d="M5 11h14" />
      <circle cx="9" cy="14" r="1" />
      <circle cx="15" cy="14" r="1" />
      <path d="M8 17l-2 3M16 17l2 3" />
    </svg>
  );
}

const mapStyles = {
  wrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 11',
    borderRadius: 14,
    overflow: 'hidden',
    border: '1px solid var(--line)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.04)',
    background: '#e7e1d2',
  },
  canvas: { position: 'absolute', inset: 0 },
  overlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(246,246,244,0.85)',
    pointerEvents: 'none',
  },
  msg: {
    background: '#fff',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--ink-2)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    maxWidth: '70%',
    textAlign: 'center',
  },
  modeBadge: {
    position: 'absolute', top: 12, left: 12,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'oklch(0.62 0.13 155)',
    color: '#fff', padding: '6px 10px', borderRadius: 999,
    fontSize: 12, fontWeight: 600,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
    zIndex: 1,
  },
};

window.MapView = MapView;
