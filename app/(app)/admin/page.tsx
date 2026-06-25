import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Music2, Users } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ count: beatCount }, { count: userCount }] = await Promise.all([
    supabase.from('beats').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div
      className="min-h-dvh p-6 flex flex-col gap-6"
      style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
    >
      <h1 className="text-2xl font-bold">Admin</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-secondary/30 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Music2 className="w-4 h-4" />
            Beats
          </div>
          <span className="text-4xl font-bold">{beatCount ?? 0}</span>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/30 p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            Users
          </div>
          <span className="text-4xl font-bold">{userCount ?? 0}</span>
        </div>
      </div>
    </div>
  )
}
