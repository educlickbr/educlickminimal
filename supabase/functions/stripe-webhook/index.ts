import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "npm:stripe@^17.0.0";
import { createClient } from "npm:@supabase/supabase-js@^2.49.0";

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response(JSON.stringify({ error: "stripe-signature ausente" }), { status: 400 });
        }

        const rawBody = await req.text();
        const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

        // Debug: log para entender o que está chegando
        console.log("Secret prefix:", secret.substring(0, 12) + "...");
        console.log("Signature prefix:", signature.substring(0, 50) + "...");
        console.log("Body length:", rawBody.length);

        const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
        const event = await stripe.webhooks.constructEventAsync(
            rawBody, signature, secret
        );

        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const pedidoId = session.metadata?.pedido_id;
            if (!pedidoId) {
                return new Response(JSON.stringify({ received: true }), { status: 200 });
            }

            const SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);
            const supabase = createClient(Deno.env.get("SUPABASE_URL")!, SECRET_KEYS.default);

            await supabase.from("com_pedido").update({
                status: "concluido",
                stripe_payment_intent_id: session.payment_intent,
                pago_em: new Date().toISOString(),
                modificado_em: new Date().toISOString(),
            } as any).eq("id", pedidoId);

            const { id_programa, id_entidade, id_usuario } = session.metadata || {};
            if (id_programa && id_entidade && id_usuario) {
                await supabase.rpc("aca_criar_matricula", {
                    p_id_entidade: id_entidade,
                    p_id_programa: id_programa,
                    p_id_usuario: id_usuario,
                    p_id_pedido: pedidoId,
                    p_usuario_id: id_usuario,
                } as any);
            }

            return new Response(JSON.stringify({ received: true, pedido_id: pedidoId }), { status: 200 });
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (err) {
        console.error("Erro no webhook:", err);
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
