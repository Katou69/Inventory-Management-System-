export default function ModalTabs({
  tabs, active, onChange, errorTabs,
}: {
  tabs: readonly string[]
  active: number
  onChange: (i: number) => void
  errorTabs?: Record<number, boolean>
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(i)}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            active === i ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {label}
          {errorTabs?.[i] && <span className="text-red-500"> •</span>}
        </button>
      ))}
    </div>
  )
}
