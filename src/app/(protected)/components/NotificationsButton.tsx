import { auth } from "@/auth"
import { getRiskAlerts, getUnreadAlertIds } from "@/lib/dashboard/getRiskAlerts"
import { NotificationsDropdown } from "./NotificationsDropdown"

export async function NotificationsButton() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const [alerts, readAlertIds] = await Promise.all([
    getRiskAlerts(session.user.id),
    getUnreadAlertIds(session.user.id),
  ])

  return <NotificationsDropdown alerts={alerts} readAlertIds={readAlertIds} />
}

