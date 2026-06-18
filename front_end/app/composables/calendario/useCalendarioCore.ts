/**
 * useCalendarioCore
 * Compartilhado entre as tabs de academico_calendario.
 */
import { useAppStore } from "~~/stores/app"

export function useCalendarioCore() {
  const store = useAppStore()

  function getEntidadeAtivaId(): string | null {
    const entidades = (store as any).entidades || []
    for (const ent of entidades) {
      if (ent.tipo === "empresa" && Array.isArray(ent.produtos)) {
        if (ent.produtos.some((p: any) => p.slug === "academico")) return ent.id
      }
    }
    if (entidades[0]?.id) return entidades[0].id
    return (store as any).company?.id || null
  }

  async function garantirEntidade(): Promise<string> {
    let id = getEntidadeAtivaId()
    if (!id) { await store.initSession(); id = getEntidadeAtivaId() }
    if (!id) throw new Error("Entidade ativa não encontrada")
    return id
  }

  return { getEntidadeAtivaId, garantirEntidade }
}
