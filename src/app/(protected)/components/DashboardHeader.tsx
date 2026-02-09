import { UserMenu } from "./UserMenu"
import { NotificationsButton } from "./NotificationsButton"

interface DashboardHeaderProps {
  userName: string
  userEmail?: string
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#05060B]/80 backdrop-blur border-b border-[#141B29]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 lg:px-10 py-4 sm:py-5 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold truncate">Visão Geral</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop Notifications and User */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-3">
            <NotificationsButton />
            <UserMenu userName={userName} userEmail={userEmail} />
          </div>

          {/* Mobile Notifications and User */}
          <div className="lg:hidden flex items-center gap-2">
            <NotificationsButton />
            <UserMenu userName={userName} userEmail={userEmail} />
          </div>
        </div>
      </div>
    </header>
  )
}
