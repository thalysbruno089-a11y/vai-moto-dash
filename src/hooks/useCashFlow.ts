import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { cashFlowSchema } from '@/lib/validation';

export type CashFlowEntry = Tables<'cash_flow'>;
export type CashFlowInsert = TablesInsert<'cash_flow'>;
export type CashFlowUpdate = TablesUpdate<'cash_flow'>;

export interface CashFlowWithCategory extends CashFlowEntry {
  categories?: { name: string } | null;
}

export const useCashFlow = () => {
  return useQuery({
    queryKey: ['cash_flow'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_flow')
        .select(`
          *,
          categories(name)
        `)
        .order('flow_date', { ascending: false });
      
      if (error) throw error;
      return data as CashFlowWithCategory[];
    },
  });
};

export const useCreateCashFlow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: Omit<CashFlowInsert, 'company_id'>) => {
      // Validate input data
      const validationResult = cashFlowSchema.safeParse(entry);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('cash_flow')
        .insert({ ...entry, company_id: profile.company_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      toast.success('Lançamento cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar lançamento', { description: error.message });
    },
  });
};

export const useUpdateCashFlow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: CashFlowUpdate & { id: string }) => {
      // Validate input data (partial validation for updates)
      const partialSchema = cashFlowSchema.partial();
      const validationResult = partialSchema.safeParse(updates);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      const { data, error } = await supabase
        .from('cash_flow')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      toast.success('Lançamento atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar lançamento', { description: error.message });
    },
  });
};

export const useDeleteCashFlow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cash_flow')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      toast.success('Lançamento excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir lançamento', { description: error.message });
    },
  });
};
