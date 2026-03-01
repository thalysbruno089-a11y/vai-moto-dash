import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ExpenseCategory = 'pneu' | 'relacao' | 'oleo' | 'outros';

export interface MotorcycleExpense {
  id: string;
  company_id: string;
  category: ExpenseCategory;
  value: number;
  mileage: number | null;
  description: string | null;
  service_date: string;
  plate: string | null;
  created_at: string;
  updated_at: string;
}

export interface MotorcycleExpenseInsert {
  category: ExpenseCategory;
  value: number;
  mileage?: number | null;
  description?: string | null;
  service_date: string;
  plate?: string | null;
}

export const categoryLabels: Record<ExpenseCategory, string> = {
  pneu: 'Pneu',
  relacao: 'Relação',
  oleo: 'Óleo',
  outros: 'Outros',
};

export const useMotorcycleExpenses = (category?: ExpenseCategory) => {
  return useQuery({
    queryKey: ['motorcycle_expenses', category],
    queryFn: async () => {
      let query = supabase
        .from('motorcycle_expenses')
        .select('*')
        .order('service_date', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MotorcycleExpense[];
    },
  });
};

export const useAllMotorcycleExpenses = () => {
  return useQuery({
    queryKey: ['motorcycle_expenses', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motorcycle_expenses')
        .select('*')
        .order('service_date', { ascending: false });
      if (error) throw error;
      return data as MotorcycleExpense[];
    },
  });
};

export const useCreateMotorcycleExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expense: MotorcycleExpenseInsert) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('motorcycle_expenses')
        .insert({ ...expense, company_id: profile.company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycle_expenses'] });
      toast({ title: 'Despesa registrada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao registrar despesa', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteMotorcycleExpense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('motorcycle_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycle_expenses'] });
      toast({ title: 'Despesa excluída com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao excluir despesa', description: error.message, variant: 'destructive' });
    },
  });
};
