/**
 * useProgAtividadesCore
 *
 * Composable compartilhado entre todas as tabs de Programação de Atividades.
 * Fornece getEntidadeAtivaId() — mesma lógica do useOfertaCore.
 */

import { useAppStore } from "~~/stores/app"

export function useProgAtividadesCore() {
  const store = useAppStore()

  function getEntidadeAtivaId(): string | null {
    // Preferência: entidade ativa resolvida pela sessão (Fase B/C)
    const ativa = (store as any).entidade_ativa?.id
    if (ativa) return ativa

    // Fallback legado (dev/localhost sem entidade resolvida por domínio)
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
