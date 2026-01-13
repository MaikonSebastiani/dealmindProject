import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "./components/Sidebar"

export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/?callbackUrl=/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#05060B] text-white flex">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}


