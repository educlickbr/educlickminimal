-- MIGRATION: Revoga permissões de service_role nas RPCs customizadas
-- Data: 2026-03-18

DO $$
BEGIN
  IF to_regprocedure('public.get_user_expandido_header(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_user_expandido_header(uuid) FROM service_role';
  END IF;

  IF to_regprocedure('public.upsert_categoria_nome(uuid,text)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.upsert_categoria_nome(uuid, text) FROM service_role';
  END IF;

  IF to_regprocedure('public.upsert_categoria_nome(uuid,text,text,uuid,integer,uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.upsert_categoria_nome(uuid, text, text, uuid, integer, uuid) FROM service_role';
  END IF;

  IF to_regprocedure('public.delete_categoria_segura(uuid,boolean)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.delete_categoria_segura(uuid, boolean) FROM service_role';
  END IF;
END;
$$;
