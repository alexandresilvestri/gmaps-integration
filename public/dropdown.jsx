// Custom dropdown with search + rich rows (avatar/name/address)
const { useState, useRef, useEffect } = React;

function Dropdown({ label, placeholder, options, value, onChange, kind, accent }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 10);
    }
  }, [open]);

  const filtered = options.filter(o => {
    if (!q) return true;
    const hay = `${o.name || ''} ${o.role || ''} ${o.address || ''} ${o.code || ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const selected = options.find(o => o.id === value);

  return (
    <div ref={ref} style={dropdownStyles.wrap}>
      <label style={dropdownStyles.label}>
        <span style={{ ...dropdownStyles.dot, background: accent }}></span>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...dropdownStyles.trigger,
          borderColor: open ? 'var(--ink)' : 'var(--line)',
          boxShadow: open ? '0 0 0 3px rgba(20,20,20,0.06)' : 'var(--shadow)',
        }}
      >
        {selected ? (
          <div style={dropdownStyles.selected}>
            {kind === 'employee' ? (
              <div style={{ ...dropdownStyles.avatar, background: selected.avatar }}>
                {selected.name.split(' ').map(n => n[0]).slice(0,2).join('')}
              </div>
            ) : (
              <div style={dropdownStyles.siteIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>
              </div>
            )}
            <div style={dropdownStyles.selectedText}>
              <div style={dropdownStyles.selectedName}>{selected.name}</div>
              <div style={dropdownStyles.selectedSub}>{selected.address}</div>
            </div>
          </div>
        ) : (
          <span style={dropdownStyles.placeholder}>{placeholder}</span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', color: 'var(--ink-3)' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {open && (
        <div style={dropdownStyles.panel}>
          <div style={dropdownStyles.searchWrap}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)' }}>
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={kind === 'employee' ? 'Buscar por nome, cargo, endereço…' : 'Buscar obra ou endereço…'}
              style={dropdownStyles.search}
            />
            {q && <button onClick={() => setQ('')} style={dropdownStyles.clear}>×</button>}
          </div>
          <div style={dropdownStyles.list}>
            {filtered.length === 0 && (
              <div style={dropdownStyles.empty}>Nenhum resultado para "{q}"</div>
            )}
            {filtered.map(o => (
              <button
                key={o.id}
                onClick={() => { onChange(o.id); setOpen(false); setQ(''); }}
                style={{
                  ...dropdownStyles.row,
                  background: o.id === value ? 'var(--accent-soft)' : 'transparent',
                }}
                onMouseEnter={e => { if (o.id !== value) e.currentTarget.style.background = '#faf9f5'; }}
                onMouseLeave={e => { if (o.id !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                {kind === 'employee' ? (
                  <div style={{ ...dropdownStyles.avatar, background: o.avatar }}>
                    {o.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                  </div>
                ) : (
                  <div style={dropdownStyles.siteIconSm}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>
                  </div>
                )}
                <div style={dropdownStyles.rowText}>
                  <div style={dropdownStyles.rowTop}>
                    <span style={dropdownStyles.rowName}>{o.name}</span>
                    {o.role && <span style={dropdownStyles.rowTag}>{o.role}</span>}
                    {o.code && <span style={{ ...dropdownStyles.rowTag, ...dropdownStyles.rowCode }} className="mono">{o.code}</span>}
                  </div>
                  <div style={dropdownStyles.rowAddr}>{o.address}</div>
                </div>
                {o.id === value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
          <div style={dropdownStyles.footer} className="mono">
            <span>{filtered.length} de {options.length}</span>
            <span>↑↓ navegar</span>
          </div>
        </div>
      )}
    </div>
  );
}

const dropdownStyles = {
  wrap: { position: 'relative', flex: 1, minWidth: 0 },
  label: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
    color: 'var(--ink-2)', textTransform: 'uppercase',
    marginBottom: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  trigger: {
    width: '100%',
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 150ms',
    fontFamily: 'inherit',
    minHeight: 66,
  },
  selected: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
  selectedText: { flex: 1, minWidth: 0 },
  selectedName: { fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  selectedSub: { fontSize: 12, color: 'var(--ink-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  placeholder: { flex: 1, color: 'var(--ink-3)', fontSize: 14 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: 'var(--ink)',
    flexShrink: 0,
  },
  siteIcon: {
    width: 38, height: 38, borderRadius: 10,
    background: 'oklch(0.94 0.02 250)',
    color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  siteIconSm: {
    width: 32, height: 32, borderRadius: 8,
    background: 'oklch(0.94 0.02 250)',
    color: 'var(--accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  panel: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(20,20,20,0.10), 0 2px 6px rgba(20,20,20,0.06)',
    zIndex: 50,
    overflow: 'hidden',
  },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px',
    borderBottom: '1px solid var(--line-2)',
  },
  search: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 13, color: 'var(--ink)',
    background: 'transparent', fontFamily: 'inherit',
  },
  clear: {
    width: 20, height: 20, borderRadius: 10,
    border: 'none', background: 'var(--line-2)',
    color: 'var(--ink-2)', cursor: 'pointer',
    fontSize: 16, lineHeight: 1, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },
  list: {
    maxHeight: 320, overflowY: 'auto',
    padding: 4,
  },
  empty: {
    padding: '24px 16px', textAlign: 'center',
    color: 'var(--ink-3)', fontSize: 13,
  },
  row: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 10px',
    border: 'none', borderRadius: 8,
    cursor: 'pointer', textAlign: 'left',
    transition: 'background 100ms',
    fontFamily: 'inherit',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTop: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowName: { fontSize: 13, fontWeight: 600, color: 'var(--ink)' },
  rowTag: {
    fontSize: 10, fontWeight: 500,
    padding: '2px 6px', borderRadius: 4,
    background: 'var(--line-2)', color: 'var(--ink-2)',
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  rowCode: { background: '#1a1a1a', color: '#fff' },
  rowAddr: { fontSize: 12, color: 'var(--ink-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  footer: {
    padding: '8px 14px',
    borderTop: '1px solid var(--line-2)',
    fontSize: 10, letterSpacing: 0.5,
    color: 'var(--ink-3)',
    display: 'flex', justifyContent: 'space-between',
    background: '#fafaf7',
  },
};

window.Dropdown = Dropdown;
