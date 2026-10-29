// Entradas da Semana por forma de pagamento.
// Fonte: motoboy_payment_history (pix_amount / cash_amount / other_amount, paid_at).

export interface DashboardPaymentRow {
  id: string;
  motoboy_name: string;
  amount: number;
  pix_amount: number;
  cash_amount: number;
  other_amount: number;
  paid_at: string;
}

export interface PaymentTotals {
  cash: number;
  pix: number;
  other: number;
  cashPlusPix: number;
}

/** Pagamentos feitos dentro do ciclo Quinta→Quarta, ignorando o que veio antes do último "Zerar Semana". */
export function filterWeekPayments(
  rows: DashboardPaymentRow[],
  weekStart: Date,
  weekEnd: Date,
  resetAt: Date | null
): DashboardPaymentRow[] {
  const weekEndInclusive = new Date(weekEnd);
  weekEndInclusive.setHours(23, 59, 59, 999);
  return rows.filter((row) => {
    const paidAt = new Date(row.paid_at);
    if (paidAt < weekStart || paidAt > weekEndInclusive) return false;
    if (resetAt && paidAt <= resetAt) return false;
    return true;
  });
}

export function sumPaymentTotals(rows: DashboardPaymentRow[]): PaymentTotals {
  let cash = 0;
  let pix = 0;
  let other = 0;
  for (const row of rows) {
    cash += Number(row.cash_amount) || 0;
    pix += Number(row.pix_amount) || 0;
    other += Number(row.other_amount) || 0;
  }
  return { cash, pix, other, cashPlusPix: cash + pix };
}

/** Formas de pagamento usadas em um registro. */
export function paymentMethods(row: DashboardPaymentRow): string[] {
  const methods: string[] = [];
  if (Number(row.pix_amount) > 0) methods.push("Pix");
  if (Number(row.cash_amount) > 0) methods.push("Dinheiro");
  if (Number(row.other_amount) > 0) methods.push("Outros");
  return methods.length ? methods : ["Sem forma"];
}
