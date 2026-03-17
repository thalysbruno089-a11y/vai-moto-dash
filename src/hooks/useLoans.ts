import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Loan {
  id: string;
  company_id: string;
  type: 'lent' | 'borrowed';
  person_name: string;
  notes: string | null;
  principal_amount: number;
  interest_rate: number;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  company_id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  notes: string | null;
  created_at: string;
}

export const useLoans = (type: 'lent' | 'borrowed') => {
  return useQuery({
    queryKey: ['loans', type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('type', type)
        .order('due_date', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as Loan[];
    },
  });
};

export const useLoanPayments = (loanId: string) => {
  return useQuery({
    queryKey: ['loan_payments', loanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data as LoanPayment[];
    },
    enabled: !!loanId,
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (loan: { type: 'lent' | 'borrowed'; person_name: string; notes?: string; principal_amount: number; interest_rate: number; due_date?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('loans')
        .insert({ ...loan, company_id: profile.company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['loans', vars.type] });
      toast.success('Empréstimo cadastrado!');
    },
    onError: (e) => toast.error('Erro ao cadastrar', { description: e.message }),
  });
};

export const useCreateLoanPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: { loan_id: string; amount: number; payment_date: string; notes?: string; payment_type: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
      if (!profile?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('loan_payments')
        .insert({ ...payment, company_id: profile.company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments', vars.loan_id] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Pagamento registrado!');
    },
    onError: (e) => toast.error('Erro ao registrar pagamento', { description: e.message }),
  });
};

export const useUpdateLoanStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('loans').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Status atualizado!');
    },
    onError: (e) => toast.error('Erro', { description: e.message }),
  });
};

export const useDeleteLoan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Empréstimo excluído!');
    },
    onError: (e) => toast.error('Erro ao excluir', { description: e.message }),
  });
};

// Simplified calculation using payment_type
export const calculateLoanDetails = (loan: Loan, payments: LoanPayment[]) => {
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const rate = Number(loan.interest_rate) / 100;

  // Interest payments: only count payments marked as 'interest'
  const totalInterestPaid = payments
    .filter(p => p.payment_type === 'interest')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Principal payments: only count payments marked as 'principal'
  const totalPrincipalPaid = payments
    .filter(p => p.payment_type === 'principal')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const remainingBalance = Math.max(0, Number(loan.principal_amount) - totalPrincipalPaid);
  const monthlyInterest = remainingBalance * rate;

  // Calculate total interest accrued based on months since creation
  const loanStart = new Date(loan.created_at);
  const now = new Date();
  const monthsSinceCreation = Math.max(0,
    (now.getFullYear() - loanStart.getFullYear()) * 12 + (now.getMonth() - loanStart.getMonth())
  );
  // Approximate total interest (simplified)
  const totalInterestAccrued = Number(loan.principal_amount) * rate * monthsSinceCreation;

  return {
    totalPaid,
    remainingBalance,
    monthlyInterest,
    totalInterestAccrued,
    totalInterestPaid,
    totalPrincipalPaid,
    totalWithInterest: remainingBalance + monthlyInterest,
  };
};

export const useUpdateLoanPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, payment_date, notes, payment_type }: { id: string; amount: number; payment_date: string; notes?: string; payment_type?: string }) => {
      const updateData: any = { amount, payment_date, notes: notes || null };
      if (payment_type) updateData.payment_type = payment_type;
      const { error } = await supabase
        .from('loan_payments')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Pagamento atualizado!');
    },
    onError: (e) => toast.error('Erro ao atualizar', { description: e.message }),
  });
};

export const useDeleteLoanPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loan_payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan_payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Pagamento excluído!');
    },
    onError: (e) => toast.error('Erro ao excluir', { description: e.message }),
  });
};
