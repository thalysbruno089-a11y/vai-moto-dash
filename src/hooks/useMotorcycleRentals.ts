import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MotorcycleRental {
  id: string;
  company_id: string;
  plate: string;
  color: string;
  renter_name: string;
  renter_phone: string | null;
  daily_rate: number;
  pickup_date: string;
  return_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export type RentalInsert = Omit<MotorcycleRental, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
export type RentalUpdate = Partial<RentalInsert> & { id: string };

export const useMotorcycleRentals = () => {
  return useQuery({
    queryKey: ['motorcycle_rentals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motorcycle_rentals' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MotorcycleRental[];
    },
  });
};

export const useCreateRental = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rental: Omit<RentalInsert, 'status'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { error } = await supabase
        .from('motorcycle_rentals' as any)
        .insert({
          ...rental,
          company_id: profile.company_id,
          status: 'active',
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycle_rentals'] });
      toast({ title: 'Aluguel registrado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar aluguel', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateRental = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: RentalUpdate) => {
      const { error } = await supabase
        .from('motorcycle_rentals' as any)
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycle_rentals'] });
      toast({ title: 'Aluguel atualizado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteRental = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('motorcycle_rentals' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycle_rentals'] });
      toast({ title: 'Aluguel removido com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    },
  });
};
