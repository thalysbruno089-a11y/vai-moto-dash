import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WeeklyClosing {
  id: string;
  company_id: string;
  week_start: string;
  week_end: string;
  income: number;
  expense: number;
  created_at: string;
}

export const useWeeklyClosings = () => {
  return useQuery({
    queryKey: ["weekly_closings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_closings" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown) as WeeklyClosing[];
    },
  });
};

export const useSaveWeeklyClosing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (closing: {
      week_start: string;
      week_end: string;
      income: number;
      expense: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Não autenticado");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { data, error } = await supabase
        .from("weekly_closings" as any)
        .insert({
          company_id: profile.company_id,
          week_start: closing.week_start,
          week_end: closing.week_end,
          income: closing.income,
          expense: closing.expense,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly_closings"] });
    },
  });
};
