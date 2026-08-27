/**
 * Catálogo de recursos de permissão (ilhas × botões × rotas).
 * Fonte: documentacao/arquitetura/permissoes.md §3 — constante no front + seed.
 *
 * Chave de permissão: 'ilha' | 'ilha:botao'. Rotas mapeiam para (ilha, botao).
 */
export interface RecursoPermissao {
    ilha: string;
    botao: string;
    rota: string;
}

export const CATALOGO_PERMISSOES: RecursoPermissao[] = [
    // Ilha Acadêmico
    { ilha: "academico", botao: "oferta_cursos", rota: "/academico_oferta" },
    { ilha: "academico", botao: "formularios", rota: "/formularios" },
    { ilha: "academico", botao: "processo_seletivo", rota: "/processos" },
    { ilha: "academico", botao: "matriculas", rota: "/matriculas" },
    { ilha: "academico", botao: "docentes", rota: "/docentes" },
    { ilha: "academico", botao: "calendario_escolar", rota: "/academico_calendario" },
    { ilha: "academico", botao: "calendario_salas", rota: "/calendario-salas" },
    { ilha: "academico", botao: "atribuicao", rota: "/atribuicao" },
    { ilha: "academico", botao: "programacao_atividades", rota: "/programacao_atividades" },
    { ilha: "academico", botao: "avaliacoes", rota: "/avaliacoes" },
    { ilha: "academico", botao: "diario_classe", rota: "/diario_classe" },
    // Ilha Comercial
    { ilha: "comercial", botao: "produtos", rota: "/produtos" },
    { ilha: "comercial", botao: "gateway", rota: "/configuracoes/pagamento" },
    { ilha: "comercial", botao: "vendas", rota: "/vendas" },
    { ilha: "comercial", botao: "dashboard", rota: "/dashboard_vendas" },
    // Portal do Aluno
    { ilha: "portal_aluno", botao: "meus_processos", rota: "/meus-processos" },
    { ilha: "portal_aluno", botao: "meus_cursos", rota: "/meus-cursos" },
    { ilha: "portal_aluno", botao: "minhas_atividades", rota: "/minhas_atividades" },
    { ilha: "portal_aluno", botao: "certificados", rota: "/certificados" },
    { ilha: "portal_aluno", botao: "gestao_faltas", rota: "/gestao_faltas" },
    // Portal Docente
    { ilha: "portal_docente", botao: "atividades_entregas", rota: "/portal-docente/entregas" },
    { ilha: "portal_docente", botao: "minha_conta", rota: "/portal-docente/conta" },
];

/** Todas as ilhas do catálogo (ordem de exibição). */
export const ILHAS_PERMISSOES: string[] = [
    "academico",
    "comercial",
    "portal_aluno",
    "portal_docente",
];

/** Resolve a rota para o recurso (ilha, botao) do catálogo. */
export function recursoDaRota(rota: string): RecursoPermissao | undefined {
    const pathInicial = String(rota ?? "");
    if (!pathInicial) return undefined;
    // ignora parâmetros/query: compara apenas o path base
    const idx = pathInicial.indexOf("?");
    const semQuery = idx >= 0 ? pathInicial.slice(0, idx) : pathInicial;
    const path = semQuery.endsWith("/")
        ? semQuery.slice(0, -1)
        : semQuery;
    return CATALOGO_PERMISSOES.find((r) => {
        if (r.rota === path) return true;
        // rotas com segmento extra (ex: /portal-docente/entregas/:id)
        return path.startsWith(r.rota + "/");
    });
}
