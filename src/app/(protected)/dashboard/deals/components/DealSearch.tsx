"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function DealSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get("search") || ""
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setSearchTerm(currentSearch)
  }, [currentSearch])

  const handleSearch = (term: string) => {
    setSearchTerm(term)

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce: aguardar 300ms antes de atualizar a URL
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (term.trim()) {
        params.set("search", term.trim())
      } else {
        params.delete("search")
      }

      router.push(`/dashboard/deals?${params.toString()}`)
    }, 300)
  }

  const clearSearch = () => {
    setSearchTerm("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    router.push(`/dashboard/deals?${params.toString()}`)
  }

  return (
    <div className="relative w-full lg:max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C889E]" />
      <input
        type="text"
        placeholder="Buscar por nome, endereço ou tipo..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="h-10 w-full rounded-lg bg-[#05060B] border border-[#141B29] pl-10 pr-10 text-sm text-white placeholder-[#7C889E] outline-none focus:border-[#2D5BFF]"
      />
      {currentSearch && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C889E] hover:text-white transition-colors"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

