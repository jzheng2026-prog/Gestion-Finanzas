'use client'

type Tipo = 'ingreso' | 'retiro'

export function TipoToggle({
  value,
  onChange,
}: {
  value: Tipo
  onChange: (tipo: Tipo) => void
}) {
  return (
    <div className="flex gap-2" role="group" aria-label="Tipo de movimiento">
      <button
        type="button"
        onClick={() => onChange('ingreso')}
        aria-pressed={value === 'ingreso'}
        className="segment flex-1 py-2"
      >
        Ingreso
      </button>
      <button
        type="button"
        onClick={() => onChange('retiro')}
        aria-pressed={value === 'retiro'}
        className="segment segment-danger flex-1 py-2"
      >
        Retiro
      </button>
    </div>
  )
}
