import { validateAdminSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ComptabiliteLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await validateAdminSession()
  if (!isAdmin) redirect('/admin/login')
  return <>{children}</>
}