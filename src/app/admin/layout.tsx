import { redirect } from 'next/navigation'
import { validateAdminSession } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // La page login est exclue par le middleware, mais on vérifie quand même
  const isAdmin = await validateAdminSession()

  return (
    <div className="min-h-screen bg-noir-950 flex">
      {isAdmin && <AdminNav />}
      <main className={`flex-1 ${isAdmin ? 'ml-0 md:ml-56' : ''}`}>
        {children}
      </main>
    </div>
  )
}