import { usePermissionsStore } from "~/stores/permissions";

export default defineNuxtRouteMiddleware(async (to, from) => {
  // List of public routes that don't require permissions or authentication check
  const publicRoutes = [
    "/login",
    "/cadastro",
    "/recuperar_senha",
    "/trocar_senha",
    "/processo_seletivo",
    "/access-denied",
    "/avaliacao/publica",
    "/avaliacao/validar",
    "/declaracao/publica",
    "/declaracao/validar",
    "/certificado/publica",
    "/certificado/validar",
  ];

  // Skip checking for public routes
  if (
    publicRoutes.some(
      (route) => to.path === route || to.path.startsWith(route + "/"),
    )
  ) {
    return;
  }

  const permissionsStore = usePermissionsStore();

  // Ensure permissions are loaded (awaiting here ensures we have data before routing)
  if (!permissionsStore.loaded) {
    try {
      await permissionsStore.fetchPermissions();
    } catch (e) {
      console.warn("Failed to fetch permissions in middleware, continuing:", e);
    }
  }

  // Map Routes to Permission Keys
  // We match start of path to handle nested routes if necessary, or exact match
  const routePermissions: Record<string, string> = {
    "/processo_seletivo": "btn_processos_abertos",
    "/selecao/estudante": "btn_selecao_estudante",
    "/selecao/docente": "btn_selecao_docente",
    "/meus-processos": "btn_meus_processos",
    "/selecao/painel": "btn_painel_selecao",
    "/matriculas": "btn_matriculas",
    "/carometro": "btn_carometro",
    "/cursos-turmas": "btn_cursos_turmas",
    "/calendario-salas": "btn_calendario_salas",
    "/producao/estoque": "btn_estoque",
    "/producao/salas": "btn_salas",
    "/producao/reservas": "btn_reservas",
    "/producao/reservas-colaboradores": "btn_reservas_colaboradores",
    "/avaliacao-gestao": "btn_avaliacao",
    "/gestao-certificados": "btn_certificados",
    "/diario/extensao": "btn_diario_extensao",
    "/diario/regulares": "btn_diario_regulares",
    "/diario/cursos_livres": "btn_diario_cursos_livres",
    "/diario/especializacao": "btn_diario_especializacao",
    "/gestao-faltas": "btn_gestao_faltas",
    "/editais-abertos": "btn_editais",
    "/aluno/eventos": "btn_eventos",
    "/oportunidades-abertas": "btn_oportunidades",
    "/bolsas-inscricoes": "btn_bolsa_estudos",
    "/declaracoes-alunos": "btn_declaracoes",
    "/documentos-academico": "btn_documentos_curso",
    "/avaliacoes-alunos": "btn_avaliacoes_aluno",
    "/meus-certificados": "btn_meus_certificados",
    // Projetos e Oportunidades Admin
    "/bolsas/admin/painel": "btn_bolsa_oportunidade",
    "/bolsas/admin/editais": "btn_editais_admin",
    "/bolsas/admin/oportunidades": "btn_oportunidades_admin",
    // JNPTA
    "/jnpta": "btn_meus_grupos_jnpta",
    // Secretaria
    "/colaboradores": "btn_secretaria_colaboradores",
    "/gestao-documentos": "btn_criar_documentos_curso",
  };

  // Check if current route needs permission
  // We check exact match or if the route starts with the key (for parameterized routes, handled carefully)
  // For now, simple exact match or startsWith logic from map keys.

  let requiredPermission = null;

  // Sort keys by length desc to match most specific path first
  const sortedRoutes = Object.keys(routePermissions).sort(
    (a, b) => b.length - a.length,
  );

  for (const routePath of sortedRoutes) {
    if (to.path === routePath || to.path.startsWith(routePath + "/")) {
      requiredPermission = routePermissions[routePath];
      break;
    }
  }

  if (requiredPermission) {
    if (!permissionsStore.can(requiredPermission)) {
      // Only check Supabase user on client-side to avoid SSR hydration issues
      if (process.client) {
        const user = useSupabaseUser();
        if (!user.value) {
          console.warn(
            `Redirecting unauthenticated user from ${to.path} to /processo_seletivo`,
          );
          return navigateTo({
            path: "/processo_seletivo",
            query: { redirect: to.fullPath },
          });
        }
      }

      console.warn(
        `Access denied to ${to.path}. Missing permission: ${requiredPermission}`,
      );
      return navigateTo("/access-denied");
    }
  }
});
