import { createDealAction } from "../actions"
import { DealForm } from "../components/DealForm"

export default function NewDealPage() {
  return (
    <DealForm
      title="Novo Deal"
      subtitle="Preencha os dados do projeto para calcular a viabilidade."
      breadcrumb={[
        { label: "Deals", href: "/dashboard/deals" },
        { label: "Novo Deal", href: "/dashboard/deals/new" },
      ]}
      submitLabel="Criar Deal"
      cancelHref="/dashboard/deals"
      action={createDealAction}
    />
  )
}


