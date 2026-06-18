/**
 * useFormulariosCore
 *
 * Composable compartilhado entre todas as tabs de formulários.
 */

import { useAppStore } from "~~/stores/app"

export const mapTipoPergunta: Record<string, string> = {
  text: "Texto Curto", textarea: "Texto Longo", number: "Número",
  email: "E-mail", data: "Data", date: "Data", select: "Seleção", file: "Arquivo",
}

export function useFormulariosCore() {
  const store = useAppStore()

  function getEntidadeAtivaId(): string | null {
    const entidades = (store as any).entidades || []
    for (const ent of entidades) {
      if (ent.tipo === "empresa" && Array.isArray(ent.produtos)) {
        if (ent.produtos.some((p: any) => p.slug === "academico")) return ent.id
      }
    }
    if (entidades[0]?.id) return entidades[0].id
    if ((store as any).company?.id) return (store as any).company.id
    return null
  }

  async function garantirEntidade(): Promise<string> {
    let id = getEntidadeAtivaId()
    if (!id) { await store.initSession(); id = getEntidadeAtivaId() }
    if (!id) throw new Error("Entidade ativa não encontrada")
    return id
  }

  function getTipoPerguntaLabel(tipo: string) {
    return mapTipoPergunta[tipo] || tipo
  }

  return { getEntidadeAtivaId, garantirEntidade, getTipoPerguntaLabel }
}
