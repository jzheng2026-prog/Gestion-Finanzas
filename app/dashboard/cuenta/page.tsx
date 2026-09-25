import { headers } from 'next/headers'
import { CuentaCliente } from './cuenta-cliente'

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ recuperar?: string }>
}) {
  const { recuperar } = await searchParams
  const email = (await headers()).get('x-user-email') ?? ''
  return <CuentaCliente recuperando={recuperar === '1'} email={email} />
}
