import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MonthlyClosing {
  id: string;
  company_id: string;
  month: number;
  year: number;
  income: number;
  expense: number;
  created_at: string;
}

export const useMonthlyClosings = () => {
  return useQuery({
    queryKey: ['monthly_closings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_closings')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data as MonthlyClosing[];
    },
  });
};

export const useSaveMonthlyClosing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (closing: { month: number; year: number; income: number; expense: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('monthly_closings')
        .upsert(
          { company_id: profile.company_id, month: closing.month, year: closing.year, income: closing.income, expense: closing.expense },
          { onConflict: 'company_id,month,year' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly_closings'] });
      toast.success('Mês salvo com sucesso!');
    },
    onError: (e) => toast.error('Erro ao salvar', { description: e.message }),
  });
};
