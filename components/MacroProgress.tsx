export function MacroProgress({ label, value, target }: { label: string; value: number; target: number }) {
  const percent = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return <div style={{ marginTop: 16 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 7 }}><span>{label}</span><span className="muted">{value} / {target} g</span></div><div className="progress"><span style={{ width: `${percent}%` }} /></div></div>;
}
