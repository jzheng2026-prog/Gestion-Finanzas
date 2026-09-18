'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

type Movimiento = {
  fecha: string
  tipo: 'ingreso' | 'retiro'
  monto: number
}

export function BalanceChart({ movimientos }: { movimientos: Movimiento[] }) {
  // Los movimientos llegan en orden descendente (más reciente primero),
  // los invertimos para calcular el balance acumulado en el tiempo
  const ordenados = [...movimientos].reverse()

  let acumulado = 0
  const datos = ordenados.map((m) => {
    acumulado += m.tipo === 'ingreso' ? m.monto : -m.monto
    return {
      fecha: new Date(m.fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      }),
      balance: acumulado,
    }
  })

  if (datos.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Necesitas al menos dos movimientos para ver la evolución.
      </p>
    )
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1F6F54" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#1F6F54" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#DEDACD" vertical={false} />
          <XAxis
            dataKey="fecha"
            stroke="#6B6558"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6B6558"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}€`}
          />
          <Tooltip
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #DEDACD',
              borderRadius: 0,
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value).toFixed(2)} €`, 'Balance']}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#1F6F54"
            strokeWidth={2}
            fill="url(#colorBalance)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}