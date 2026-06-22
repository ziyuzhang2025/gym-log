export function ProgressBar({ percent }: { percent: number }) { return <div className="progress" aria-label={`${percent}% complete`}><span style={{ width: `${percent}%` }} /></div>; }
