import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';

export interface Ride {
  id: string;
  company_id: string;
  client_id: string;
  motoboy_id: string;
  ride_date: string;
  value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RideWithRelations extends Ride {
  clients?: { name: string } | null;
  motoboys?: { name: string; number: string | null } | null;
}

export interface RideInsert {
  client_id: string;
  motoboy_id: string;
  ride_date: string;
  value: number;
  notes?: string | null;
}

// Validation schema
const rideSchema = z.object({
  client_id: z.string().uuid('Cliente é obrigatório'),
  motoboy_id: z.string().uuid('Motoboy é obrigatório'),
  ride_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  value: z.number().min(0, 'Valor não pode ser negativo').max(10000000, 'Valor muito alto'),
  notes: z.string().max(500, 'Observações muito longas').optional().nullable(),
});

export const useRides = (filters?: { clientId?: string; motoboyId?: string; startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['rides', filters],
    queryFn: async () => {
      let query = supabase
        .from('rides')
        .select(`
          *,
          clients(name),
          motoboys(name, number)
        `)
        .order('ride_date', { ascending: false });
      
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.motoboyId) {
        query = query.eq('motoboy_id', filters.motoboyId);
      }
      if (filters?.startDate) {
        query = query.gte('ride_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('ride_date', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as RideWithRelations[];
    },
  });
};

export const useRidesByClient = (clientId: string) => {
  return useQuery({
    queryKey: ['rides', 'by-client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          motoboys(name, number)
        `)
        .eq('client_id', clientId)
        .order('ride_date', { ascending: false });
      
      if (error) throw error;
      return data as RideWithRelations[];
    },
    enabled: !!clientId,
  });
};

export const useRidesStatsByClient = (clientId: string) => {
  return useQuery({
    queryKey: ['rides-stats', 'by-client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          ride_date,
          value,
          motoboy_id,
          motoboys(name, number)
        `)
        .eq('client_id', clientId)
        .order('ride_date', { ascending: false });
      
      if (error) throw error;

      // Group by date and motoboy
      const byDate = new Map<string, { date: string; total: number; rides: number; motoboys: Map<string, { name: string; number: string | null; rides: number; value: number }> }>();
      
      (data || []).forEach(ride => {
        const dateKey = ride.ride_date;
        if (!byDate.has(dateKey)) {
          byDate.set(dateKey, { date: dateKey, total: 0, rides: 0, motoboys: new Map() });
        }
        const dayData = byDate.get(dateKey)!;
        dayData.total += Number(ride.value);
        dayData.rides += 1;
        
        const motoboyKey = ride.motoboy_id;
        const motoboyInfo = ride.motoboys;
        if (!dayData.motoboys.has(motoboyKey)) {
          dayData.motoboys.set(motoboyKey, { 
            name: motoboyInfo?.name || 'Desconhecido', 
            number: motoboyInfo?.number || null,
            rides: 0, 
            value: 0 
          });
        }
        const motoboyData = dayData.motoboys.get(motoboyKey)!;
        motoboyData.rides += 1;
        motoboyData.value += Number(ride.value);
      });

      return Array.from(byDate.values()).map(day => ({
        ...day,
        motoboys: Array.from(day.motoboys.entries()).map(([id, data]) => ({ id, ...data })),
      }));
    },
    enabled: !!clientId,
  });
};

export const useCreateRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ride: RideInsert) => {
      // Validate input data
      const validationResult = rideSchema.safeParse(ride);
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
        .from('rides')
        .insert({ ...ride, company_id: profile.company_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-stats'] });
      toast.success('Corrida registrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar corrida', { description: error.message });
    },
  });
};

export interface RideUpdate {
  id: string;
  client_id?: string;
  motoboy_id?: string;
  ride_date?: string;
  value?: number;
  notes?: string | null;
}

export const useUpdateRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: RideUpdate) => {
      // Validate input data (partial validation for updates)
      const partialSchema = rideSchema.partial();
      const validationResult = partialSchema.safeParse(updates);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      const { data, error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-stats'] });
      toast.success('Corrida atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar corrida', { description: error.message });
    },
  });
};

export const useToggleRidePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: string }) => {
      const { data, error } = await supabase
        .from('rides')
        .update({ payment_status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-stats'] });
      toast.success('Status de pagamento atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar pagamento', { description: error.message });
    },
  });
};

export const useDeleteRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rides')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients-with-stats'] });
      toast.success('Corrida excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir corrida', { description: error.message });
    },
  });
};
