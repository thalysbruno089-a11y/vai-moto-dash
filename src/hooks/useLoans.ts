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
    mutationFn: async (loan: { type: 'lent' | 'borrowed'; person_name: string; notes?: string; principal_amount: number; interest_rate: number }) => {
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
  
  const sortedPayments = [...payments].sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime());
  
  // Normalize to start of day to avoid time-of-day comparison issues with date-only payment_date
  const loanStart = new Date(loan.created_at);
  loanStart.setHours(0, 0, 0, 0);
  const now = new Date();
  const monthsDiff = Math.max(0, (now.getFullYear() - loanStart.getFullYear()) * 12 + (now.getMonth() - loanStart.getMonth()));
  
  let balance = Number(loan.principal_amount);
  let totalInterestAccrued = 0;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  
  for (let m = 0; m < monthsDiff; m++) {
    const monthInterest = balance * rate;
    totalInterestAccrued += monthInterest;
    
    // Find payments in this month
    const monthDate = new Date(loanStart.getFullYear(), loanStart.getMonth() + m + 1, 1);
    const nextMonth = new Date(loanStart.getFullYear(), loanStart.getMonth() + m + 2, 1);
    
    const monthPayments = sortedPayments.filter(p => {
      const d = new Date(p.payment_date);
      return d >= monthDate && d < nextMonth;
    });
    
    let monthPaidTotal = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
    
    // First cover interest, then reduce principal
    if (monthPaidTotal <= monthInterest) {
      totalInterestPaid += monthPaidTotal;
      // Nothing reduces the principal
    } else {
      totalInterestPaid += monthInterest;
      const principalReduction = monthPaidTotal - monthInterest;
      totalPrincipalPaid += principalReduction;
      balance = Math.max(0, balance - principalReduction);
    }
  }

  // Payments made in current month (not yet accrued interest month)
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const currentMonthPayments = sortedPayments.filter(p => {
    const d = new Date(p.payment_date);
    return d >= currentMonthStart && d < currentMonthEnd && d >= loanStart;
  });
  // Check if these weren't already counted
  const alreadyCounted = new Set<string>();
  for (let m = 0; m < monthsDiff; m++) {
    const monthDate = new Date(loanStart.getFullYear(), loanStart.getMonth() + m + 1, 1);
    const nextMonth = new Date(loanStart.getFullYear(), loanStart.getMonth() + m + 2, 1);
    sortedPayments.filter(p => {
      const d = new Date(p.payment_date);
      if (d >= monthDate && d < nextMonth) alreadyCounted.add(p.id);
    });
  }
  const uncountedPayments = currentMonthPayments.filter(p => !alreadyCounted.has(p.id));
  const uncountedTotal = uncountedPayments.reduce((s, p) => s + Number(p.amount), 0);
  
  // Current month interest on current balance
  const currentMonthInterest = balance * rate;
  if (uncountedTotal > 0) {
    if (uncountedTotal <= currentMonthInterest) {
      totalInterestPaid += uncountedTotal;
    } else {
      totalInterestPaid += currentMonthInterest;
      const principalReduction = uncountedTotal - currentMonthInterest;
      totalPrincipalPaid += principalReduction;
      balance = Math.max(0, balance - principalReduction);
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
