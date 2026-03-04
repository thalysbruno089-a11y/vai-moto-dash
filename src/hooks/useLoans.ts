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
        .order('created_at', { ascending: false });
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
    mutationFn: async (payment: { loan_id: string; amount: number; payment_date: string; notes?: string }) => {
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

// Calculate remaining balance and interest info for a loan
// Payments first cover accrued interest, only the excess reduces the principal
export const calculateLoanDetails = (loan: Loan, payments: LoanPayment[]) => {
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const rate = Number(loan.interest_rate) / 100;

  const parseDate = (d: string) => new Date(d + 'T12:00:00');

  const sortedPayments = [...payments].sort(
    (a, b) => parseDate(a.payment_date).getTime() - parseDate(b.payment_date).getTime()
  );

  const loanStart = new Date(loan.created_at);
  loanStart.setHours(0, 0, 0, 0);
  const loanStartMonth = loanStart.getFullYear() * 12 + loanStart.getMonth();

  const now = new Date();
  let lastMonth = now.getFullYear() * 12 + now.getMonth();
  for (const p of sortedPayments) {
    const d = parseDate(p.payment_date);
    const pm = d.getFullYear() * 12 + d.getMonth();
    if (pm > lastMonth) lastMonth = pm;
  }

  const totalMonths = lastMonth - loanStartMonth;

  let balance = Number(loan.principal_amount);
  let totalInterestAccrued = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  // Payments in creation month: no interest, all goes to principal
  const creationMonthPayments = sortedPayments.filter(p => {
    const d = parseDate(p.payment_date);
    return d.getFullYear() * 12 + d.getMonth() === loanStartMonth;
  });
  const creationMonthTotal = creationMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
  if (creationMonthTotal > 0) {
    totalPrincipalPaid += creationMonthTotal;
    balance = Math.max(0, balance - creationMonthTotal);
  }

  // Track unpaid interest that accumulates across months
  let unpaidInterest = 0;

  // Process each subsequent month
  for (let m = 0; m < totalMonths; m++) {
    const monthInterest = balance * rate;
    totalInterestAccrued += monthInterest;
    unpaidInterest += monthInterest;

    const targetMonth = loanStartMonth + m + 1;
    const monthPayments = sortedPayments.filter(p => {
      const d = parseDate(p.payment_date);
      return d.getFullYear() * 12 + d.getMonth() === targetMonth;
    });

    let monthPaidTotal = monthPayments.reduce((s, p) => s + Number(p.amount), 0);

    // First: pay off accumulated interest
    if (monthPaidTotal > 0) {
      const interestPayment = Math.min(monthPaidTotal, unpaidInterest);
      totalInterestPaid += interestPayment;
      unpaidInterest -= interestPayment;
      monthPaidTotal -= interestPayment;

      // Remainder reduces principal
      if (monthPaidTotal > 0) {
        totalPrincipalPaid += monthPaidTotal;
        balance = Math.max(0, balance - monthPaidTotal);
      }
    }
  }

  const monthlyInterest = balance * rate;

  return {
    totalPaid,
    remainingBalance: balance,
    monthlyInterest,
    totalInterestAccrued,
    totalInterestPaid,
    totalPrincipalPaid,
    totalWithInterest: balance + monthlyInterest,
  };
};

export const useUpdateLoanPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, payment_date, notes }: { id: string; amount: number; payment_date: string; notes?: string }) => {
      const { error } = await supabase
        .from('loan_payments')
        .update({ amount, payment_date, notes: notes || null })
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
