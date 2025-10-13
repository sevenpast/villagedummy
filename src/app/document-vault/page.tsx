import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentVault from '@/components/document-vault/DocumentVault'

export default async function DocumentVaultPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return <DocumentVault />
}
