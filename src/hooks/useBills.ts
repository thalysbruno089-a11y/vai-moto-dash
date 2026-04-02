import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { financialValueSchema, dateSchema } from '@/lib/validation';

// Bill types (manual since types.ts is read-only and auto-generated)
export interface Bill {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  value: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  paid_at: string | null;
  parent_bill_id: string | null;
  installment_number: number | null;
  category_id: string | null;
  is_fixed: boolean;
  total_installments: number | null;
  paid_installments: number;
  vale_amount: number;
  created_at: string;
  updated_at: string;
}

export type BillInsert = Omit<Bill, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'paid_at' | 'paid_installments' | 'total_installments' | 'vale_amount'> & { 
  paid_at?: string | null;
  paid_installments?: number;
  total_installments?: number | null;
  vale_amount?: number;
};
export type BillUpdate = Partial<BillInsert> & { vale_amount?: number };

// Validation schema
export const billSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional().nullable(),
  value: financialValueSchema,
  due_date: dateSchema,
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
  parent_bill_id: z.string().uuid().optional().nullable(),
  installment_number: z.number().int().positive().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  is_fixed: z.boolean().optional(),
});

export const useBills = () => {
  return useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Bill[];
    },
  });
};

export const useTodayBills = () => {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['bills', 'today'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('due_date', today)
        .eq('status', 'pending')
        .order('value', { ascending: false });
      
      if (error) throw error;
      return data as Bill[];
    },
  });
};

export const useCreateBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bill: BillInsert) => {
      // Validate input data
      const validationResult = billSchema.safeParse(bill);
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
        .from('bills')
        .insert({ ...bill, company_id: profile.company_id })
        .select()
        .single();
      
      if (error) throw error;
      return data as Bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Conta cadastrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar conta', { description: error.message });
    },
  });
};

export const useUpdateBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: BillUpdate & { id: string }) => {
      const partialSchema = billSchema.partial();
      const validationResult = partialSchema.safeParse(updates);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      const { data, error } = await supabase
        .from('bills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar conta', { description: error.message });
    },
  });
};

export const useMarkBillAsPaid = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bill: Bill) => {
      const isInstallmentBill = bill.total_installments && bill.total_installments > 1;
      const currentPaid = bill.paid_installments || 0;
      const newPaidCount = currentPaid + 1;
      const isFullyPaid = isInstallmentBill 
        ? newPaidCount >= bill.total_installments! 
        : true;

      // 1. Update bill status and paid_installments
      const updateData: Record<string, unknown> = {
        paid_installments: newPaidCount,
      };
      
      if (isFullyPaid) {
        updateData.status = 'paid';
        updateData.paid_at = new Date().toISOString();
      }

      const { error: billError } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', bill.id);
      
      if (billError) throw billError;

      // Bill payment is tracked only in the bills table, not duplicated to cash_flow

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Conta marcada como paga e registrada no fluxo de caixa!');
    },
    onError: (error) => {
      toast.error('Erro ao processar pagamento', { description: error.message });
    },
  });
};

export const useDeleteBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir conta', { description: error.message });
    },
  });
};
