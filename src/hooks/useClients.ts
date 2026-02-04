import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { z } from 'zod';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientUpdate = TablesUpdate<'clients'>;

export interface ClientWithStats extends Client {
  total_rides: number;
  total_value: number;
}

// Validation schema
const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  phone: z.string().max(20, 'Telefone muito longo').optional().nullable(),
  address: z.string().max(500, 'Endereço muito longo').optional().nullable(),
  notes: z.string().max(1000, 'Observações muito longas').optional().nullable(),
});

export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Client[];
    },
  });
};

export const useClientsWithStats = () => {
  return useQuery({
    queryKey: ['clients-with-stats'],
    queryFn: async () => {
      // First get all clients
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });
      
      if (clientsError) throw clientsError;

      // Then get ride stats for each client
      const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('client_id, value');
      
      if (ridesError) throw ridesError;

      // Calculate stats
      const statsMap = new Map<string, { total_rides: number; total_value: number }>();
      
      (rides || []).forEach(ride => {
        const current = statsMap.get(ride.client_id) || { total_rides: 0, total_value: 0 };
        statsMap.set(ride.client_id, {
          total_rides: current.total_rides + 1,
          total_value: current.total_value + Number(ride.value),
        });
      });

      return (clients || []).map(client => ({
        ...client,
        total_rides: statsMap.get(client.id)?.total_rides || 0,
        total_value: statsMap.get(client.id)?.total_value || 0,
      })) as ClientWithStats[];
    },
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (client: Omit<ClientInsert, 'company_id'>) => {
      // Validate input data
      const validationResult = clientSchema.safeParse(client);
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
        .from('clients')
        .insert({ ...client, company_id: profile.company_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-stats'] });
      toast.success('Cliente adicionado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar cliente', { description: error.message });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: ClientUpdate & { id: string }) => {
      // Validate input data
      const validationResult = clientSchema.partial().safeParse(data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      const { data: result, error } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-stats'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cliente', { description: error.message });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-stats'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir cliente', { description: error.message });
    },
  });
};
