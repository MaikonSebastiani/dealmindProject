import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { LoginScreen } from "@/components/auth/LoginScreen"

export default async function Page() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return <LoginScreen />
}

