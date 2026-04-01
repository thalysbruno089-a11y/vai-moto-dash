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

    // Get all fixed bills that are 'paid'
    const { data: paidFixedBills, error: fetchError } = await supabase
      .from("bills")
      .select("id, due_date")
      .eq("is_fixed", true)
      .eq("status", "paid");

    if (fetchError) throw fetchError;

    if (!paidFixedBills || paidFixedBills.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Nenhuma conta fixa para resetar", resetCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For each fixed bill, reset status and update due_date to same day in current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let resetCount = 0;

    for (const bill of paidFixedBills) {
      // Parse the original due date to get the day
      const originalDate = new Date(bill.due_date + "T12:00:00");
      const day = originalDate.getDate();

      // Create new due date with same day in current month
      // Handle months with fewer days (e.g., Feb 30 -> Feb 28)
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const newDay = Math.min(day, lastDayOfMonth);
      const newDueDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(newDay).padStart(2, "0")}`;

      const { error: updateError } = await supabase
        .from("bills")
        .update({ status: "pending", paid_at: null, due_date: newDueDate })
        .eq("id", bill.id);

      if (updateError) {
        console.error(`Error updating bill ${bill.id}:`, updateError);
      } else {
        resetCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `${resetCount} contas fixas redefinidas para pendente com datas atualizadas`, resetCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
