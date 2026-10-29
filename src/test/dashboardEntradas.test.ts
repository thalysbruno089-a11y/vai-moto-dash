import { describe, it, expect } from "vitest";
import { filterWeekPayments, sumPaymentTotals, paymentMethods } from "@/lib/dashboardEntradas";
import type { DashboardPaymentRow } from "@/lib/dashboardEntradas";

const row = (over: Partial<DashboardPaymentRow> = {}): DashboardPaymentRow => ({
  id: "r1",
  motoboy_name: "João",
  amount: 100,
  pix_amount: 0,
  cash_amount: 0,
  other_amount: 0,
  paid_at: "2026-10-29T15:00:00Z",
  ...over,
});

// Ciclo: quinta 22/10 → quarta 28/10/2026 (janela)
const weekStart = new Date(2026, 9, 22, 0, 0, 0, 0);
const weekEnd = new Date(2026, 9, 28, 0, 0, 0, 0);

describe("filterWeekPayments", () => {
  it("mantém pagamentos dentro do ciclo quinta→quarta", () => {
    const rows = [
      row({ id: "in", paid_at: "2026-10-27T18:00:00Z" }),
      row({ id: "before", paid_at: "2026-10-21T18:00:00Z" }),
      row({ id: "after", paid_at: "2026-10-29T02:00:00Z" }),
    ];
    const filtered = filterWeekPayments(rows, weekStart, weekEnd, null);
    expect(filtered.map((r) => r.id)).toEqual(["in"]);
  });

  it("descarta pagamentos anteriores ao último Zerar Semana", () => {
    const resetAt = new Date("2026-10-26T03:00:00Z");
    const rows = [
      row({ id: "antes", paid_at: "2026-10-25T18:00:00Z" }),
      row({ id: "depois", paid_at: "2026-10-27T18:00:00Z" }),
    ];
    const filtered = filterWeekPayments(rows, weekStart, weekEnd, resetAt);
    expect(filtered.map((r) => r.id)).toEqual(["depois"]);
  });
});

describe("sumPaymentTotals", () => {
  it("soma dinheiro, pix e a combinação dinheiro+pix", () => {
    const totals = sumPaymentTotals([
      row({ pix_amount: 150, cash_amount: 50, other_amount: 10 }),
      row({ pix_amount: 200, cash_amount: 0, other_amount: 0 }),
    ]);
    expect(totals.cash).toBe(50);
    expect(totals.pix).toBe(350);
    expect(totals.other).toBe(10);
    expect(totals.cashPlusPix).toBe(400);
  });
});

describe("paymentMethods", () => {
  it("lista as formas usadas e cai em 'Sem forma' quando nada informado", () => {
    expect(paymentMethods(row({ pix_amount: 10, cash_amount: 5 }))).toEqual(["Pix", "Dinheiro"]);
    expect(paymentMethods(row())).toEqual(["Sem forma"]);
  });
});
