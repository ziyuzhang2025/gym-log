import Link from "next/link";
export function EmptyState() { return <section className="card" style={{ padding: 24, marginTop: 28 }}><p style={{ marginTop: 0 }}>No workout plan yet. Create your first plan.</p><Link className="button" href="/plan">Create Plan</Link></section>; }
