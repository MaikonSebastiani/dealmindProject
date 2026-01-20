import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "./components/Sidebar"

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/?callbackUrl=/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#05060B] text-white flex flex-col lg:flex-row">
      <Sidebar userName={session.user.name ?? "Usuário"} userEmail={session.user.email ?? undefined} />
      <main className="flex-1 min-w-0 lg:pl-0">{children}</main>
    </div>
  )
}


