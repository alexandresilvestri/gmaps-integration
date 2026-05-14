const { useState, useEffect } = React;

function App() {
  const [employees, setEmployees] = useState([]);
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [empId, setEmpId] = useState(null);
  const [siteId, setSiteId] = useState(null);
  const [mode, setMode] = useState('transit');

  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  useEffect(() => {
    Promise.all([window.api.fetchEmployees(), window.api.fetchWorks()])
      .then(([emps, wks]) => { setEmployees(emps); setWorks(wks); })
      .catch(e => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!empId || !siteId) { setRoute(null); setRouteError(null); return; }
    setRouteLoading(true);
    setRouteError(null);
    window.api.fetchRoute(empId, siteId)
      .then(setRoute)
      .catch(e => setRouteError(e.message))
      .finally(() => setRouteLoading(false));
  }, [empId, siteId]);

  const employee = employees.find(e => e.id === empId);
  const site = works.find(s => s.id === siteId);
  const ready = !!(employee && site && route);

  return (
    <div style={appStyles.shell}>
      <header style={appStyles.header}>
        <div style={appStyles.brand}>
          <div style={appStyles.brandMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>
          <div>
            <div style={appStyles.brandTitle}>Consulta de Trajeto</div>
            <div style={appStyles.brandSub}>Colaborador → Obra · Passagens de ônibus</div>
          </div>
        </div>
        <div style={appStyles.headerMeta} className="mono">
          <span style={appStyles.statusDot}></span>
          {loading ? 'Carregando base…' : `Base sincronizada · ${employees.length} colaboradores · ${works.length} obras`}
        </div>
      </header>

      <section style={appStyles.inputsCard}>
        <div style={appStyles.inputsRow}>
          <Dropdown
            label="Colaborador (origem)"
            placeholder={loading ? 'Carregando…' : 'Selecione um colaborador…'}
            options={employees}
            value={empId}
            onChange={setEmpId}
            kind="employee"
            accent="#1a1a1a"
          />
          <div style={appStyles.arrowCol}>
            <div style={appStyles.arrowLine}></div>
            <div style={appStyles.arrowCircle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="13 6 19 12 13 18"/>
              </svg>
            </div>
            <div style={appStyles.arrowLine}></div>
          </div>
          <Dropdown
            label="Endereço de obra (destino)"
            placeholder={loading ? 'Carregando…' : 'Selecione uma obra…'}
            options={works}
            value={siteId}
            onChange={setSiteId}
            kind="site"
            accent="oklch(0.62 0.14 250)"
          />
        </div>
      </section>

      {loadError && (
        <div style={appStyles.errorBanner}>Falha ao carregar dados: {loadError}</div>
      )}

      {!employee || !site ? (
        <EmptyState empSelected={!!employee} siteSelected={!!site} />
      ) : routeLoading ? (
        <LoadingState />
      ) : routeError ? (
        <div style={appStyles.errorBanner}>Falha ao calcular trajeto: {routeError}</div>
      ) : ready ? (
        <ResultPanel employee={employee} site={site} route={route} mode={mode} setMode={setMode} />
      ) : null}

      <footer style={appStyles.footer} className="mono">
        {route?.transit?.source === 'google'
          ? 'Dados em tempo real · Google Routes API'
          : 'Dados de fallback · defina GOOGLE_MAPS_API_KEY para usar Routes API'}
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={emptyStyles.wrap}>
      <div style={emptyStyles.title}>Calculando trajeto…</div>
      <div style={emptyStyles.subtitle}>Consultando Google Routes API para modo transit.</div>
    </div>
  );
}

function EmptyState({ empSelected, siteSelected }) {
  const steps = [
    { done: empSelected,  label: 'Selecione um colaborador' },
    { done: siteSelected, label: 'Selecione um endereço de obra' },
  ];
  return (
    <div style={emptyStyles.wrap}>
      <div style={emptyStyles.illustration}>
        <svg viewBox="0 0 240 140" width="240" height="140">
          <defs>
            <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(70,55,30,0.18)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="240" height="140" rx="10" fill="#f0ece2"/>
          <rect x="0" y="0" width="240" height="140" rx="10" fill="url(#dots)"/>
          <path d="M 30 100 Q 80 60 120 80 T 210 40" fill="none" stroke="rgba(70,55,30,0.35)" strokeWidth="1.4" strokeDasharray="3 3"/>
          <g transform="translate(30, 100)">
            <circle r="6" fill="#1a1a1a"/>
            <circle r="2" fill="#fff"/>
          </g>
          <g transform="translate(210, 40)">
            <circle r="6" fill="oklch(0.62 0.14 250)"/>
            <circle r="2" fill="#fff"/>
          </g>
        </svg>
      </div>
      <h2 style={emptyStyles.title}>Selecione origem e destino</h2>
      <p style={emptyStyles.subtitle}>Os dados de distância, tempo e passagens de ônibus aparecerão aqui assim que ambos forem escolhidos.</p>
      <div style={emptyStyles.steps}>
        {steps.map((s, i) => (
          <div key={i} style={emptyStyles.step}>
            <div style={{ ...emptyStyles.stepDot, background: s.done ? 'oklch(0.62 0.13 155)' : 'transparent', borderColor: s.done ? 'oklch(0.62 0.13 155)' : 'var(--ink-3)' }}>
              {s.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <span style={{ ...emptyStyles.stepLabel, color: s.done ? 'var(--ink)' : 'var(--ink-2)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({ employee, site, route, mode, setMode }) {
  const current = route[mode];
  const modes = [
    { id: 'transit', label: 'Ônibus',    km: route.transit.km, min: route.transit.min },
    { id: 'drive',   label: 'Carro',     km: route.drive.km,   min: route.drive.min },
    { id: 'bike',    label: 'Bicicleta', km: route.bike.km,    min: route.bike.min },
    { id: 'walk',    label: 'A pé',      km: route.walk.km,    min: route.walk.min },
  ];

  const transitStats = mode === 'transit';
  const tickets = route.transit.busTickets;
  const fare = route.transit.fareEstimateBRL;

  return (
    <section style={resultStyles.wrap}>
      <div style={resultStyles.grid}>
        <div style={resultStyles.mapCol}>
          <MapView from={employee} to={site} route={route} mode={mode} />
          <div style={resultStyles.modePills}>
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  ...resultStyles.modePill,
                  ...(mode === m.id ? resultStyles.modePillActive : {}),
                }}
              >
                <div style={resultStyles.modePillTop}>
                  <span style={resultStyles.modePillLabel}>{m.label}</span>
                </div>
                <div style={resultStyles.modePillTime} className="mono">{formatMin(m.min)}</div>
                <div style={resultStyles.modePillKm} className="mono">{m.km} km</div>
              </button>
            ))}
          </div>
        </div>

        <aside style={resultStyles.sideCol}>
          {transitStats ? (
            <div style={resultStyles.heroBlock}>
              <div style={resultStyles.heroLabel} className="mono">PASSAGENS NECESSÁRIAS</div>
              <div style={resultStyles.heroValue}>
                <span>{tickets}</span><span style={resultStyles.heroUnit}>{tickets === 1 ? 'passagem' : 'passagens'}</span>
              </div>
              <div style={resultStyles.heroSub}>
                Custo estimado <strong style={{ color: 'var(--ink)' }}>R$ {fare.toFixed(2).replace('.', ',')}</strong> · {formatMin(current.min)} · {current.km} km
              </div>
            </div>
          ) : (
            <div style={resultStyles.heroBlock}>
              <div style={resultStyles.heroLabel} className="mono">DISTÂNCIA TOTAL</div>
              <div style={resultStyles.heroValue}>
                <span>{current.km}</span><span style={resultStyles.heroUnit}>km</span>
              </div>
              <div style={resultStyles.heroSub}>
                <strong style={{ color: 'var(--ink)' }}>{formatMin(current.min)}</strong> · {modeName(mode)}
              </div>
            </div>
          )}

          <div style={resultStyles.statGrid}>
            <Stat label="Linha reta" value={`${route.straightKm} km`} hint="haversine" />
            <Stat label="Distância" value={`${current.km} km`} hint={modeName(mode)} />
            {transitStats ? (
              <>
                <Stat label="Baldeações" value={String(route.transit.transfers)} hint={route.transit.transfers ? 'ônibus' : 'direto'} />
                <Stat label="Fonte" value={route.transit.source === 'google' ? 'Google' : 'Mock'} hint={route.transit.source === 'google' ? 'Routes API' : 'sem chave'} />
              </>
            ) : mode === 'drive' ? (
              <>
                <Stat label="Pedágios" value={String(route.drive.tolls)} hint="estimado" />
                <Stat label="Combustível" value={`${route.drive.fuelL} L`} hint={`≈ R$ ${route.drive.fuelCost.toFixed(2).replace('.', ',')}`} />
              </>
            ) : (
              <>
                <Stat label="Tempo" value={formatMin(current.min)} hint={modeName(mode)} />
                <Stat label="Modal" value={modeName(mode)} hint="" />
              </>
            )}
          </div>

          <div style={resultStyles.endpoints}>
            <Endpoint dotColor="#1a1a1a" letter="A" label="Origem" name={employee.name} sub={employee.address} />
            <div style={resultStyles.endpointSep}>
              <div style={resultStyles.endpointSepLine}></div>
              <span className="mono" style={resultStyles.endpointSepLabel}>{route.straightKm} km em linha reta</span>
              <div style={resultStyles.endpointSepLine}></div>
            </div>
            <Endpoint dotColor="oklch(0.62 0.14 250)" letter="B" label="Destino" name={site.name} sub={site.address} />
          </div>

          <div style={resultStyles.actions}>
            <button style={{ ...resultStyles.btn, ...resultStyles.btnPrimary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar
            </button>
            <button style={resultStyles.btn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14"/></svg>
              Limpar
            </button>
          </div>
        </aside>
      </div>

      <div style={resultStyles.steps}>
        <div style={resultStyles.stepsHeader}>
          <div>
            <div style={resultStyles.stepsTitle}>Indicações passo a passo</div>
            <div style={resultStyles.stepsSub}>{route.steps.length} etapas · {formatMin(current.min)} · {current.km} km</div>
          </div>
          <div style={resultStyles.stepsLegend} className="mono">{modeName(mode).toUpperCase()}</div>
        </div>
        <ol style={resultStyles.stepsList}>
          {route.steps.map((s, i) => (
            <li key={i} style={resultStyles.stepRow}>
              <div style={resultStyles.stepIcon}>
                <StepIcon kind={s.icon} />
              </div>
              <div style={resultStyles.stepText}>{s.text}</div>
              <div style={resultStyles.stepDist} className="mono">{s.dist}</div>
              <div style={resultStyles.stepTime} className="mono">{s.time}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div style={statStyles.wrap}>
      <div style={statStyles.label} className="mono">{label.toUpperCase()}</div>
      <div style={statStyles.value}>{value}</div>
      {hint && <div style={statStyles.hint}>{hint}</div>}
    </div>
  );
}

function Endpoint({ dotColor, letter, label, name, sub }) {
  return (
    <div style={endpointStyles.wrap}>
      <div style={{ ...endpointStyles.dot, background: dotColor }}>{letter}</div>
      <div style={endpointStyles.text}>
        <div style={endpointStyles.label} className="mono">{label.toUpperCase()}</div>
        <div style={endpointStyles.name}>{name}</div>
        <div style={endpointStyles.sub}>{sub}</div>
      </div>
    </div>
  );
}

function StepIcon({ kind }) {
  const p = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'start')    return <svg {...p}><circle cx="12" cy="12" r="6" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="#fff"/></svg>;
  if (kind === 'right')    return <svg {...p}><path d="M12 19V8M12 8l4 4M12 8l-4 4M8 19h8"/></svg>;
  if (kind === 'left')     return <svg {...p}><path d="M5 12h14M5 12l4-4M5 12l4 4"/></svg>;
  if (kind === 'straight') return <svg {...p}><path d="M12 19V5M12 5l-4 4M12 5l4 4"/></svg>;
  if (kind === 'merge')    return <svg {...p}><path d="M8 21V11l8-8v18"/><path d="M8 11L4 15"/></svg>;
  if (kind === 'flag')     return <svg {...p}><path d="M4 21V4M4 4h12l-2 4 2 4H4"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="3"/></svg>;
}

function formatMin(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}
function modeName(mode) {
  return { drive: 'Carro', transit: 'Ônibus', walk: 'A pé', bike: 'Bicicleta' }[mode] || '—';
}

// ============= styles =============

const appStyles = {
  shell: { width: '100%', maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: 24 },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '4px 4px 12px',
    borderBottom: '1px solid var(--line)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12 },
  brandMark: {
    width: 36, height: 36, borderRadius: 8,
    background: 'var(--ink)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  brandTitle: { fontSize: 16, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.2 },
  brandSub: { fontSize: 12, color: 'var(--ink-3)', marginTop: 2 },
  headerMeta: {
    fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.4,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  statusDot: {
    width: 7, height: 7, borderRadius: 4,
    background: 'oklch(0.62 0.13 155)',
    boxShadow: '0 0 0 3px oklch(0.62 0.13 155 / 0.18)',
  },
  inputsCard: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 14,
    padding: 20,
    boxShadow: 'var(--shadow)',
  },
  inputsRow: {
    display: 'flex', alignItems: 'flex-end', gap: 16,
  },
  arrowCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    paddingBottom: 18, gap: 4,
    color: 'var(--ink-3)',
  },
  arrowLine: { width: 1, height: 14, background: 'var(--line)' },
  arrowCircle: {
    width: 28, height: 28, borderRadius: 14,
    background: 'var(--bg)',
    border: '1px solid var(--line)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--ink-2)',
  },
  errorBanner: {
    background: 'oklch(0.95 0.06 35)',
    border: '1px solid oklch(0.78 0.14 35)',
    color: 'oklch(0.40 0.14 35)',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 13,
  },
  footer: {
    fontSize: 11, color: 'var(--ink-3)', letterSpacing: 0.3,
    textAlign: 'center', paddingTop: 12,
    borderTop: '1px solid var(--line)',
  },
  code: {
    background: 'var(--line-2)', padding: '1px 6px', borderRadius: 4,
    fontSize: 10, color: 'var(--ink-2)', marginLeft: 2, marginRight: 2,
  },
};

const emptyStyles = {
  wrap: {
    background: 'var(--surface)',
    border: '1px dashed var(--line)',
    borderRadius: 14,
    padding: '48px 32px',
    textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  illustration: { marginBottom: 4 },
  title: { fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: 0 },
  subtitle: { fontSize: 14, color: 'var(--ink-3)', margin: 0, maxWidth: 380 },
  steps: {
    display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12,
    background: 'var(--bg)', padding: '14px 20px', borderRadius: 10,
  },
  step: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 },
  stepDot: {
    width: 18, height: 18, borderRadius: 10,
    border: '1.5px solid', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 200ms',
  },
  stepLabel: { transition: 'all 200ms' },
};

const resultStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: 20,
  },
  mapCol: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 },
  sideCol: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 14,
    padding: 20,
    display: 'flex', flexDirection: 'column', gap: 18,
    boxShadow: 'var(--shadow)',
  },
  modePills: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  modePill: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    padding: '10px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 150ms',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  modePillActive: {
    background: 'var(--ink)',
    borderColor: 'var(--ink)',
    color: '#fff',
  },
  modePillTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modePillLabel: { fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5 },
  modePillTime: { fontSize: 16, fontWeight: 600, marginTop: 2 },
  modePillKm: { fontSize: 11, opacity: 0.7 },
  heroBlock: {
    paddingBottom: 16,
    borderBottom: '1px solid var(--line-2)',
  },
  heroLabel: { fontSize: 10, fontWeight: 600, letterSpacing: 1.2, color: 'var(--ink-3)' },
  heroValue: {
    fontSize: 48, fontWeight: 700, color: 'var(--ink)',
    lineHeight: 1, marginTop: 6,
    display: 'flex', alignItems: 'baseline', gap: 6,
    letterSpacing: -1,
  },
  heroUnit: { fontSize: 18, fontWeight: 500, color: 'var(--ink-3)' },
  heroSub: { fontSize: 13, color: 'var(--ink-2)', marginTop: 8 },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  endpoints: { display: 'flex', flexDirection: 'column' },
  endpointSep: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 0 6px 16px',
  },
  endpointSepLine: { flex: 1, height: 1, borderTop: '1px dashed var(--line)' },
  endpointSepLabel: { fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.4 },
  actions: { display: 'flex', gap: 8 },
  btn: {
    flex: 1, padding: '10px 14px',
    border: '1px solid var(--line)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    borderRadius: 8, cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 120ms',
  },
  btnPrimary: { background: 'var(--ink)', borderColor: 'var(--ink)', color: '#fff' },
  steps: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 14,
    padding: 20,
    boxShadow: 'var(--shadow)',
  },
  stepsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 14, borderBottom: '1px solid var(--line-2)', marginBottom: 4,
  },
  stepsTitle: { fontSize: 15, fontWeight: 600, color: 'var(--ink)' },
  stepsSub: { fontSize: 12, color: 'var(--ink-3)', marginTop: 2 },
  stepsLegend: {
    fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-2)',
    padding: '4px 10px', background: 'var(--line-2)', borderRadius: 4,
  },
  stepsList: { listStyle: 'none', padding: 0, margin: 0 },
  stepRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    alignItems: 'center', gap: 14,
    padding: '12px 4px',
    borderBottom: '1px solid var(--line-2)',
    fontSize: 13,
  },
  stepIcon: {
    width: 32, height: 32, borderRadius: 16,
    background: 'var(--bg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--ink-2)',
  },
  stepText: { color: 'var(--ink)' },
  stepDist: { fontSize: 12, color: 'var(--ink-2)', minWidth: 60, textAlign: 'right' },
  stepTime: { fontSize: 12, color: 'var(--ink-3)', minWidth: 60, textAlign: 'right' },
};

const statStyles = {
  wrap: {
    padding: '12px 14px',
    background: 'var(--bg)',
    borderRadius: 8,
  },
  label: { fontSize: 9, fontWeight: 600, letterSpacing: 0.8, color: 'var(--ink-3)' },
  value: { fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginTop: 4 },
  hint: { fontSize: 11, color: 'var(--ink-3)', marginTop: 2 },
};

const endpointStyles = {
  wrap: { display: 'flex', gap: 12, padding: '4px 0' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    color: '#fff', fontWeight: 700, fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  text: { flex: 1, minWidth: 0 },
  label: { fontSize: 9, fontWeight: 600, letterSpacing: 1, color: 'var(--ink-3)' },
  name: { fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginTop: 2 },
  sub: { fontSize: 12, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.45 },
  meta: { fontSize: 11, color: 'var(--ink-3)', marginTop: 4 },
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
