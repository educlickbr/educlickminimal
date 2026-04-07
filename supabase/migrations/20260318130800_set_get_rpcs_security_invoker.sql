-- MIGRATION: Força RPCs de leitura a usar SECURITY INVOKER
-- Data: 2026-03-18
-- Motivo: RLS já protege por entidade, leituras devem respeitar contexto do usuário

DO $$
BEGIN
  IF to_regprocedure('public.get_categorias_hierarquicas(uuid,integer,integer,integer)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_categorias_hierarquicas(uuid, integer, integer, integer) SECURITY INVOKER';
  END IF;

  IF to_regprocedure('public.get_contas_hierarquicas(uuid,integer,integer,integer)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_contas_hierarquicas(uuid, integer, integer, integer) SECURITY INVOKER';
  END IF;

  IF to_regprocedure('public.get_user_expandido_header(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.get_user_expandido_header(uuid) SECURITY INVOKER';
  END IF;
END;
$$;
