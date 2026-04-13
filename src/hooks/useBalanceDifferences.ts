import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BalanceDifference {
  id: string;
  company_id: string;
  bill_id: string | null;
  bill_name: string;
  bill_value: number;
  available_balance: number;
  difference_amount: number;
  source: string;
  created_at: string;
}

export const useBalanceDifferences = () => {
  return useQuery({
    queryKey: ['balance_differences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balance_differences')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BalanceDifference[];
    },
  });
};

export const useCreateBalanceDifference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<BalanceDifference, 'id' | 'company_id' | 'created_at'>) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('balance_differences')
        .insert({ ...entry, company_id: profile.company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance_differences'] });
    },
    onError: (error) => {
      toast.error('Erro ao registrar diferença', { description: error.message });
    },
  });
};

export const useDeleteBalanceDifference = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('balance_differences')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance_differences'] });
    },
  });
};
