import { auth } from "@/auth"
import { getRiskAlerts } from "@/lib/dashboard/getRiskAlerts"
import { NotificationsDropdown } from "./NotificationsDropdown"

export async function NotificationsButton() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  const alerts = await getRiskAlerts(session.user.id)

  return <NotificationsDropdown alerts={alerts} />
}

