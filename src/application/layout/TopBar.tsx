// Application Layout: TopBar — minimal header

export function TopBar(): JSX.Element {
  return (
    <div style={{ height: 48, background: '#16213e', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', borderBottom: '1px solid #2a2a4e' }}>
      <button style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 14 }}>🌙</button>
    </div>
  );
}
