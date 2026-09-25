'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useTheme } from 'next-themes'
import { formatEUR, formatFechaCorta } from '@/lib/format'

// Recharts pinta atributos SVG, que no admiten variables CSS: mismos valores
// que los tokens de globals.css, por tema
const COLORES = {
  light: { linea: '#1F6F54', rejilla: '#DEDACD', texto: '#6B6558', fondo: '#FFFFFF' },
  dark: { linea: '#4CB38A', rejilla: '#3A423E', texto: '#A8A296', fondo: '#232B28' },
}

type Movimiento = {
  fecha: string
  tipo: 'ingreso' | 'retiro'
  monto: number
}

// Eje Y: "1.500 €" hasta 10.000; a partir de ahí, compacto ("12 mil €")
const ejeEntero = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 0,
  useGrouping: 'always',
})
const ejeCompacto = new Intl.NumberFormat('es-ES', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const formatEje = (v: number) =>
  `${(Math.abs(v) >= 10_000 ? ejeCompacto : ejeEntero).format(v).replace('-', '−')} €`

export function BalanceChart({
  movimientos,
  etiqueta = 'Balance',
}: {
  movimientos: Movimiento[]
  /** Nombre de la serie en el tooltip */
  etiqueta?: string
}) {
  const { resolvedTheme } = useTheme()
  const c = COLORES[resolvedTheme === 'dark' ? 'dark' : 'light']
  // Los movimientos llegan en orden descendente (más reciente primero),
  // los invertimos para calcular el balance acumulado en el tiempo
  const datos = useMemo(() => {
    const ordenados = [...movimientos].reverse()
    return ordenados.reduce<{ fecha: string; balance: number }[]>((acc, m) => {
      const anterior = acc.at(-1)?.balance ?? 0
      acc.push({
        fecha: formatFechaCorta(m.fecha),
        balance: anterior + (m.tipo === 'ingreso' ? m.monto : -m.monto),
      })
      return acc
    }, [])
  }, [movimientos])

  if (datos.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Con dos o más movimientos verás aquí cómo evoluciona el balance.
      </p>
    )
  }

  return (
    <figure className="h-52 w-full" aria-label={`Evolución: ${etiqueta.toLowerCase()}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.linea} stopOpacity={0.22} />
              <stop offset="100%" stopColor={c.linea} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.rejilla} strokeOpacity={0.7} vertical={false} />
          <XAxis
            dataKey="fecha"
            stroke={c.texto}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tickMargin={8}
          />
          <YAxis
            stroke={c.texto}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(value) => formatEje(Number(value))}
          />
          <Tooltip
            cursor={{ stroke: c.texto, strokeOpacity: 0.3 }}
            contentStyle={{
              background: c.fondo,
              border: `1px solid ${c.rejilla}`,
              borderRadius: 8,
              boxShadow: '0 6px 20px -10px rgb(0 0 0 / 0.3)',
              fontSize: 13,
            }}
            labelStyle={{ color: c.texto, marginBottom: 2 }}
            formatter={(value) => [formatEUR(Number(value)), etiqueta]}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={c.linea}
            strokeWidth={2}
            fill="url(#colorBalance)"
            activeDot={{ r: 4, strokeWidth: 0, fill: c.linea }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  )
}
