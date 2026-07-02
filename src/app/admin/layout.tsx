import { validateAdminSession } from '@/lib/auth'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // validateAdminSession retourne false si pas de cookie valide
  // Sur la page login, le middleware redirige déjà si connecté
  // Donc ici on vérifie juste si on doit afficher la nav
  let isAdmin = false
  try {
    isAdmin = await validateAdminSession()
  } catch {
    isAdmin = false
  }

  // Si pas admin (page login ou session expirée) : layout minimal
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-noir-950">
        {children}
      </div>
    )
  }

  // Admin connecté : layout avec sidebar
  return (
    <div className="min-h-screen bg-noir-950 flex">
      <AdminNav />
      <main className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}