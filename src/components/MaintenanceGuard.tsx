'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MaintenanceGuard({
  appType = 'admin',
}: {
  appType?: 'admin' | 'client'
}) {
  const pathname = usePathname()

  useEffect(() => {
    // Initial active session check on mount
    const checkCurrentStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('admin_maintenance, client_maintenance')
          .limit(1)
          .single()

        if (!error && data) {
          const isMaintenanceActive =
            appType === 'admin' ? data.admin_maintenance : data.client_maintenance

          if (isMaintenanceActive && pathname !== '/maintenance') {
            window.location.href = '/maintenance'
          }
        }
      } catch (err) {
        console.error('Maintenance initial check failed:', err)
      }
    }

    checkCurrentStatus()

    // Realtime WebSocket Subscription for instant updates
    const channel = supabase
      .channel('realtime_system_settings_guard')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
        },
        (payload) => {
          const isMaintenanceActive =
            appType === 'admin'
              ? payload.new.admin_maintenance
              : payload.new.client_maintenance

          if (isMaintenanceActive && pathname !== '/maintenance') {
            window.location.href = '/maintenance'
          } else if (!isMaintenanceActive && pathname === '/maintenance') {
            window.location.href = appType === 'admin' ? '/dashboard' : '/'
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [appType, pathname])

  return null
}
