import { getSettings } from '@/lib/supabase/queries'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="p-6 md:p-7 space-y-5">
      <div>
        <h1 className="text-[18px] font-medium font-inter text-[var(--text)]">Settings</h1>
        <p className="text-[12px] text-[var(--text3)] font-inter mt-0.5">
          Race goal, training zones, and preferences
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  )
}
