import { Sparkles } from 'lucide-react'

// Professional loader: a single violet arc sweeping a hairline track.
// One color, one motion, one moment — nothing else.
export function Loader({ label = 'Getting your workspace ready…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-10" role="status" aria-live="polite" aria-label={label}>
      <div className="relative size-40">
        {/* hairline track */}
        <div className="absolute inset-0 rounded-full border border-border" />
        {/* the arc — gradient sweep, masked to the ring */}
        <div
          className="farsight-arc absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg 250deg, rgba(139,92,246,0.25) 310deg, #8b5cf6 352deg, transparent 360deg)',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
          }}
        />
        {/* arc head, leads the sweep */}
        <div className="farsight-arc absolute inset-0">
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500 shadow-lg shadow-violet-500/40" />
        </div>
        {/* the mark, held still at the center */}
        <div className="absolute inset-[4.5rem] grid place-items-center">
          <Sparkles className="size-7 text-violet-500/90" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold tracking-tight">Farsight</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
