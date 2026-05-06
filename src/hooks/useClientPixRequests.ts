import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PixRequest {
  id: string;
  company_id: string;
  client_id: string;
  amount: number;
  status: 'pending' | 'paid';
  notes: string | null;
  requested_at: string;
  paid_at: string | null;
  created_at: string;
  client?: { id: string; name: string };
}

export const useClientPixRequests = () => {
  return useQuery({
    queryKey: ['client-pix-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_pix_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      if (error) throw error;

      const ids = Array.from(new Set((data || []).map((r: any) => r.client_id)));
      let clientsMap = new Map<string, { id: string; name: string }>();
      if (ids.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', ids);
        (clients || []).forEach((c: any) => clientsMap.set(c.id, c));
      }

      return (data || []).map((r: any) => ({
        ...r,
        client: clientsMap.get(r.client_id),
      })) as PixRequest[];
    },
  });
};

export const useCreatePixRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { client_id: string; amount: number; notes?: string | null }) => {
      if (!input.client_id) throw new Error('Selecione um cliente');
      if (!input.amount || input.amount <= 0) throw new Error('Valor inválido');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data: profile } = await supabase
        .from('profiles').select('company_id').eq('id', user.id).maybeSingle();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('client_pix_requests')
        .insert({
          client_id: input.client_id,
          amount: input.amount,
          notes: input.notes ?? null,
          company_id: profile.company_id,
          created_by: user.id,
        })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-pix-requests'] });
      toast.success('Solicitação registrada');
    },
    onError: (e: Error) => toast.error('Erro', { description: e.message }),
  });
};

export const useMarkPixRequestPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('client_pix_requests')
        .update({ status: 'paid', paid_at: new Date().toISOString(), paid_by: user.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-pix-requests'] });
      toast.success('Marcado como pago');
    },
    onError: (e: Error) => toast.error('Apenas o admin (Carlos) pode marcar como pago', { description: e.message }),
  });
};

export const useDeletePixRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_pix_requests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-pix-requests'] });
      toast.success('Solicitação removida');
    },
    onError: (e: Error) => toast.error('Erro', { description: e.message }),
  });
};
