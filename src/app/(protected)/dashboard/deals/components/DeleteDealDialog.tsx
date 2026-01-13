"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function DeleteDealDialog(props: {
  dealId: string
  dealName: string
  action: (formData: FormData) => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-[#3A0B16] bg-[#2A0B12] hover:bg-[#2A0B12]/80 text-[#FF5A6A]"
      >
        Excluir
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#141B29] bg-[#0B0F17] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="p-5">
              <div className="text-base font-semibold text-white">Excluir deal</div>
              <div className="mt-2 text-sm text-[#7C889E]">
                Tem certeza que deseja excluir <span className="text-white">{props.dealName || "este deal"}</span>? Essa ação não pode ser desfeita.
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-[#141B29] p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-[#141B29] bg-[#0B0F17] hover:bg-[#0B1323] text-[#9AA6BC]"
              >
                Cancelar
              </Button>

              <form action={props.action}>
                <input type="hidden" name="dealId" value={props.dealId} />
                <Button type="submit" className="bg-[#FF5A6A] hover:bg-[#FF5A6A]/90 text-white w-full sm:w-auto">
                  Confirmar exclusão
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}


