import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type Motoboy = Tables<'motoboys'>;
export type MotoboyInsert = TablesInsert<'motoboys'>;
export type MotoboyUpdate = TablesUpdate<'motoboys'>;

export const useMotoboys = () => {
  return useQuery({
    queryKey: ['motoboys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Motoboy[];
    },
  });
};

export const useCreateMotoboy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (motoboy: Omit<MotoboyInsert, 'company_id'>) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();
      
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('motoboys')
        .insert({ ...motoboy, company_id: profile.company_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoboys'] });
      toast.success('Motoboy cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar motoboy', { description: error.message });
    },
  });
};

export const useUpdateMotoboy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: MotoboyUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('motoboys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoboys'] });
      toast.success('Motoboy atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar motoboy', { description: error.message });
    },
  });
};

export const useDeleteMotoboy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('motoboys')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoboys'] });
      toast.success('Motoboy excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir motoboy', { description: error.message });
    },
  });
};
