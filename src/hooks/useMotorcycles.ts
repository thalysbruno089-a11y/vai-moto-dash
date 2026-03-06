import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Motorcycle {
  id: string;
  company_id: string;
  plate: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export const useMotorcycles = () => {
  return useQuery({
    queryKey: ['motorcycles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motorcycles')
        .select('*')
        .order('plate', { ascending: true });
      if (error) throw error;
      return data as Motorcycle[];
    },
  });
};

export const useCreateMotorcycle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { plate: string; name?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('motorcycles')
        .insert({
          plate: input.plate.trim().toUpperCase(),
          name: input.name || null,
          company_id: profile.company_id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles'] });
      toast({ title: 'Moto cadastrada com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao cadastrar moto', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteMotorcycle = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('motorcycles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles'] });
      toast({ title: 'Moto removida com sucesso!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao remover moto', description: error.message, variant: 'destructive' });
    },
  });
};
