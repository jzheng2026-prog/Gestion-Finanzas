/**
 * Descarga un CSV pensado para Excel en español: separador ";", coma decimal
 * y BOM para que respete tildes y eñes.
 */
export function descargarCSV(filas: string[][], nombreArchivo: string) {
  const escapar = (valor: string) =>
    /[;"\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor

  const csv = filas.map((fila) => fila.map(escapar).join(';')).join('\n')

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}

/** 1234.5 → "1234,50" (sin separador de miles: Excel lo lee como número) */
export const importeCSV = (n: number) => n.toFixed(2).replace('.', ',')
