/**
 * useOfertaCore
 *
 * Composable compartilhado entre todas as tabs de academico_oferta.
 * Fornece getEntidadeAtivaId() — a lógica de descobrir qual entidade
 * (empresa com produto acadêmico) está ativa no contexto do usuário.
 */

import { useAppStore } from "~~/stores/app"

export function useOfertaCore() {
  const store = useAppStore()

  function getEntidadeAtivaId(): string | null {
    const entidades = (store as any).entidades || []
    for (const ent of entidades) {
      if (ent.tipo === "empresa" && Array.isArray(ent.produtos)) {
        if (ent.produtos.some((p: any) => p.slug === "academico")) {
          return ent.id
        }
      }
    }
    if (entidades[0]?.id) return entidades[0].id
    if ((store as any).company?.id) return (store as any).company.id
    return null
  }

  async function garantirEntidade(): Promise<string> {
    let id = getEntidadeAtivaId()
    if (!id) {
      await store.initSession()
      id = getEntidadeAtivaId()
    }
    if (!id) throw new Error("Entidade ativa não encontrada")
    return id
  }

  return { getEntidadeAtivaId, garantirEntidade }
}
