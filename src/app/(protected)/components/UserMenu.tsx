"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { LogOut, User, ChevronDown } from "lucide-react"

interface UserMenuProps {
  userName: string
  userEmail?: string
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#0B1323] transition-colors"
      >
        <div className="h-9 w-9 rounded-full bg-[#0B0F17] border border-[#141B29] grid place-items-center text-xs text-white font-medium">
          {initials || "U"}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm text-white truncate max-w-[120px]">{userName}</div>
          {userEmail && (
            <div className="text-xs text-[#7C889E] truncate max-w-[120px]">{userEmail}</div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-[#7C889E] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-[#141B29] bg-[#0B0F17] shadow-xl overflow-hidden">
            {/* Header do menu */}
            <div className="px-4 py-3 border-b border-[#141B29]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0B1323] border border-[#141B29] grid place-items-center text-sm text-white font-medium">
                  {initials || "U"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{userName}</div>
                  {userEmail && (
                    <div className="text-xs text-[#7C889E] truncate">{userEmail}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Opções do menu */}
            <div className="py-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#9AA6BC] hover:bg-[#0B1323] hover:text-white transition-colors"
              >
                <User className="h-4 w-4" />
                Meu Perfil
              </button>
              
              <div className="h-px bg-[#141B29] my-1" />
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#FF5A6A] hover:bg-[#2A0B12] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

