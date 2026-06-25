import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UploadModeSwitcher } from '@/components/upload/UploadModeSwitcher'
import { Upload } from 'lucide-react'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-dvh px-4" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="pb-4 border-b border-border mb-5" style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">Upload Beats</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Share your sound with artists worldwide.</p>
      </div>
      <UploadModeSwitcher userId={user.id} />
    </div>
  )
}
