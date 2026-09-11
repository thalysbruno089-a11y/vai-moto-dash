import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';
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

      // If marking as unpaid (pending/overdue), remove the cash_flow entry
      if (updates.status && updates.status !== 'paid') {
        // Get the bill first to find its name for cash_flow matching
        const { data: currentBill } = await supabase
          .from('bills')
          .select('*')
          .eq('id', id)
          .single();
        
        if (currentBill && currentBill.status === 'paid') {
          // Remove the cash_flow expense entry that was created when marking as paid
          await supabase
            .from('cash_flow')
            .delete()
            .eq('description', currentBill.name)
            .eq('type', 'expense');
        }
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
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
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
    mutationFn: async (bill: Bill & { paid_month?: string }) => {
      // Each bill row represents a single payable item (even if it's an installment)
      const updateData: Record<string, unknown> = {
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_installments: (bill.paid_installments || 0) + 1,
      };

      const { error: billError } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', bill.id);

      if (billError) throw billError;

      // 2. Register payment in cash_flow as expense
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const netValue = bill.value - (bill.vale_amount || 0);
      const { error: cfError } = await supabase
        .from('cash_flow')
        .insert({
          company_id: profile.company_id,
          description: bill.name,
          value: netValue,
          type: 'expense' as const,
          flow_date: new Date().toISOString().split('T')[0],
          category_id: bill.category_id,
        });

      if (cfError) throw cfError;

      // 3. Record which month this payment belongs to (fixed bills reset monthly)
      const paidMonth = bill.paid_month ?? format(new Date(), 'yyyy-MM');
      const { error: bpError } = await supabase
        .from('bill_payments' as any)
        .upsert({
          company_id: profile.company_id,
          bill_id: bill.id,
          paid_month: paidMonth,
          amount: netValue,
        }, { onConflict: 'bill_id,paid_month' });

      if (bpError) throw bpError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['bill_payments'] });
      toast.success('Conta marcada como paga e registrada no fluxo de caixa!');
    },
    onError: (error) => {
      toast.error('Erro ao processar pagamento', { description: error.message });
    },
  });
};

export const useUnmarkBillPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bill, paidMonth }: { bill: Bill; paidMonth?: string }) => {
      // Remove the monthly payment record
      if (paidMonth) {
        await supabase
          .from('bill_payments' as any)
          .delete()
          .eq('bill_id', bill.id)
          .eq('paid_month', paidMonth);
      }

      // Remove the cash_flow expense — prefer entries inside the paid month,
      // fallback to all matches (legacy behavior) if none found there
      let removed = 0;
      if (paidMonth) {
        const [y, m] = paidMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const { data } = await supabase
          .from('cash_flow')
          .delete()
          .eq('description', bill.name)
          .eq('type', 'expense')
          .gte('flow_date', `${paidMonth}-01`)
          .lte('flow_date', `${paidMonth}-${String(lastDay).padStart(2, '0')}`)
          .select('id');
        removed = (data || []).length;
      }
      if (removed === 0) {
        await supabase
          .from('cash_flow')
          .delete()
          .eq('description', bill.name)
          .eq('type', 'expense');
      }

      const { error } = await supabase
        .from('bills')
        .update({ status: 'pending', paid_at: null })
        .eq('id', bill.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      queryClient.invalidateQueries({ queryKey: ['bill_payments'] });
      toast.success('Conta marcada como não paga!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar conta', { description: error.message });
    },
  });
};

export const useDeleteBill = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if bill is paid, if so remove cash_flow entry
      const { data: bill } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();
      
      if (bill && bill.status === 'paid') {
        await supabase
          .from('cash_flow')
          .delete()
          .eq('description', bill.name)
          .eq('type', 'expense');
      }

      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir conta', { description: error.message });
    },
  });
};

// ===================== Pagamentos parciais =====================

export interface BillPartialPayment {
  id: string;
  bill_id: string;
  paid_month: string;
  amount: number;
  created_at: string;
}

export const useBillPartialPayments = () => {
  return useQuery({
    queryKey: ['bill_partial_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bill_partial_payments' as any)
        .select('id, bill_id, paid_month, amount, created_at');
      if (error) throw error;
      return (data || []) as unknown as BillPartialPayment[];
    },
  });
};

export const useCreatePartialPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bill, amount, paidMonth }: { bill: Bill; amount: number; paidMonth: string }) => {
      if (!(amount > 0)) throw new Error('Informe um valor válido');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { error } = await supabase
        .from('bill_partial_payments' as any)
        .insert({
          company_id: profile.company_id,
          bill_id: bill.id,
          paid_month: paidMonth,
          amount,
        });
      if (error) throw error;

      const { error: cfError } = await supabase
        .from('cash_flow')
        .insert({
          company_id: profile.company_id,
          description: bill.name,
          value: amount,
          type: 'expense' as const,
          flow_date: new Date().toISOString().split('T')[0],
          category_id: bill.category_id,
        });
      if (cfError) throw cfError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill_partial_payments'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      toast.success('Pagamento parcial registrado!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar pagamento parcial', { description: error.message });
    },
  });
};

// ===================== Exclusão com escopo =====================

export type BillDeleteScope = 'only_this' | 'this_and_next' | 'all';

const prevMonthKey = (monthKey: string) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const useDeleteBillScoped = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bill, scope, monthKey }: { bill: Bill; scope: BillDeleteScope; monthKey: string }) => {
      // Contas não fixas só existem uma vez — qualquer escopo apaga o registro
      if (scope === 'all' || !bill.is_fixed) {
        if (bill.status === 'paid') {
          await supabase
            .from('cash_flow')
            .delete()
            .eq('description', bill.name)
            .eq('type', 'expense');
        }
        const { error } = await supabase.from('bills').delete().eq('id', bill.id);
        if (error) throw error;
        return;
      }

      if (scope === 'only_this') {
        const months = Array.from(new Set([...(bill.skipped_months || []), monthKey]));
        const { error } = await supabase
          .from('bills')
          .update({ skipped_months: months } as any)
          .eq('id', bill.id);
        if (error) throw error;
        return;
      }

      // this_and_next: conta encerra no mês anterior, histórico preservado
      const { error } = await supabase
        .from('bills')
        .update({ end_month: prevMonthKey(monthKey) } as any)
        .eq('id', bill.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['cash_flow'] });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir conta', { description: error.message });
    },
  });
};
