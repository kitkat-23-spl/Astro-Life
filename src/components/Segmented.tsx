export default function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} className={value === v ? 'active' : ''} aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>
      ))}
    </div>
  )
}
