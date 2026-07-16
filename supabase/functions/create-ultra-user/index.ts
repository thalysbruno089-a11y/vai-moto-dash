import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "ultra@vaimoto.app";
    const password = "647312";

    // Get any existing company
    const { data: companyRow } = await supabase.from("profiles").select("company_id").not("company_id", "is", null).limit(1).maybeSingle();
    const company_id = companyRow?.company_id ?? null;

    // Check existing user
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === email);

    let userId: string;
    if (existing) {
      userId = existing.id;
      await supabase.auth.admin.updateUserById(userId, { password });
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (error) throw error;
      userId = created.user!.id;
    }

    await supabase.from("profiles").upsert({
      id: userId,
      name: "ULTRA",
      role: "employee",
      company_id,
    });

    return new Response(JSON.stringify({ ok: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});