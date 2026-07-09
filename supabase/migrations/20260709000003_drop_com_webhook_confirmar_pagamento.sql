-- ============================================================
-- Drop RPC com_webhook_confirmar_pagamento
-- Substituída pela Edge Function stripe-webhook
-- que usa SUPABASE_SERVICE_ROLE_KEY (bypass RLS naturalmente)
-- ============================================================
DROP FUNCTION IF EXISTS public.com_webhook_confirmar_pagamento;
