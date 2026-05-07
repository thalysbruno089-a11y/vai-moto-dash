import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CarlosBankTx {
  id: string;
  company_id: string;
  type: "deposit" | "debit";
  amount: number;
  description: string | null;
  ride_id: string | null;
  client_id: string | null;
  client_name: string | null;
  transaction_date: string;
  created_at: string;
}

export const useCarlosBank = () => {
  return useQuery({
    queryKey: ["carlos-bank"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carlos_bank_transactions" as any)
        .select("*")
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CarlosBankTx[];
    },
  });
};

export const useCreateBankDeposit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user.id).maybeSingle();
      if (!profile?.company_id) throw new Error("Empresa não encontrada");
      const { error } = await supabase.from("carlos_bank_transactions" as any).insert({
        company_id: profile.company_id,
        type: "deposit",
        amount,
        description: description || "Depósito",
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carlos-bank"] });
      toast.success("Depósito registrado");
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });
};

export const useDeleteBankTx = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("carlos_bank_transactions" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["carlos-bank"] });
      toast.success("Removido");
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });
};