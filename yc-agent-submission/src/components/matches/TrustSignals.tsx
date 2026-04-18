import { ShieldCheck } from 'lucide-react';

export default function TrustSignals({
  signals,
  potentialFit,
  className,
}: {
  signals: string[];
  potentialFit?: boolean;
  className?: string;
}) {
  return (
    <section className={className ?? 'rounded-3xl border border-slate-700/80 bg-slate-900/65 p-6 backdrop-blur'}>
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <ShieldCheck size={17} className="text-emerald-300" />
        Trust signals
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        Signals below are based on profile data and match context, not a synthetic safety score.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {signals.map(signal => (
          <div
            key={signal}
            className="rounded-xl border border-slate-700/70 bg-slate-800/65 px-3 py-2.5 text-sm text-slate-300"
          >
            {signal}
          </div>
        ))}
        {potentialFit ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/12 px-3 py-2.5 text-sm font-medium text-amber-200">
            Potential Fit (exploratory range)
          </div>
        ) : null}
      </div>
    </section>
  );
}
