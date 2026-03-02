import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Reset all fixed bills (is_fixed = true) that are 'paid' back to 'pending'
    const { data, error } = await supabase
      .from("bills")
      .update({ status: "pending", paid_at: null })
      .eq("is_fixed", true)
      .eq("status", "paid")
      .select("id");

    if (error) throw error;

    const resetCount = data?.length || 0;

    return new Response(
      JSON.stringify({ success: true, message: `${resetCount} contas fixas redefinidas para pendente`, resetCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
