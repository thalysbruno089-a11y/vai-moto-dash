import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UltraDelivery {
  id: string;
  company_id: string | null;
  delivery_date: string;
  position: number;
  horario: string | null;
  entregador: string | null;
  endereco: string | null;
  pagamento: number | null;
  taxa: number | null;
  ok: boolean;
  tem_receita: boolean;
  receita_ok: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type UltraDeliveryInput = Partial<Omit<UltraDelivery, "id" | "created_at" | "updated_at" | "created_by">>;

export const useUltraDeliveries = (date?: string) => {
  return useQuery({
    queryKey: ["ultra-deliveries", date ?? "all"],
    queryFn: async () => {
      let q = supabase.from("ultra_deliveries" as any).select("*");
      if (date) q = q.eq("delivery_date", date);
      q = q.order("delivery_date", { ascending: false }).order("position", { ascending: true });
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as UltraDelivery[];
    },
  });
};

export const useCreateUltraDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UltraDeliveryInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles").select("company_id").eq("id", user?.id ?? "").maybeSingle();
      const payload = {
        ...input,
        company_id: profile?.company_id ?? null,
        created_by: user?.id ?? null,
      };
      const { error } = await supabase.from("ultra_deliveries" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ultra-deliveries"] });
      toast.success("Entrega registrada");
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });
};

export const useUpdateUltraDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UltraDeliveryInput }) => {
      const { error } = await supabase.from("ultra_deliveries" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ultra-deliveries"] }),
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });
};

export const useDeleteUltraDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ultra_deliveries" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ultra-deliveries"] });
      toast.success("Removido");
    },
    onError: (e: Error) => toast.error("Erro", { description: e.message }),
  });
};