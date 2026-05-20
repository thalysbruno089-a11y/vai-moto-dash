interface ReceiptData {
  motoboyName: string;
  amount: number;
  shift: string;
  paidAt: Date;
  pixAmount: number;
  cashAmount: number;
  otherAmount: number;
  notes?: string;
}

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function printMotoboyReceipt(d: ReceiptData) {
  const date = d.paidAt.toLocaleDateString("pt-BR");
  const time = d.paidAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const methods: string[] = [];
  if (d.pixAmount > 0) methods.push(`<div class="row"><span>PIX</span><span>${fmt(d.pixAmount)}</span></div>`);
  if (d.cashAmount > 0) methods.push(`<div class="row"><span>Dinheiro</span><span>${fmt(d.cashAmount)}</span></div>`);
  if (d.otherAmount > 0) methods.push(`<div class="row"><span>Outro</span><span>${fmt(d.otherAmount)}</span></div>`);

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Comprovante - ${d.motoboyName}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, Arial, sans-serif; margin: 0; padding: 24px; color: #000; font-weight: 700; }
  .receipt { max-width: 360px; margin: 0 auto; border: 1px dashed #999; padding: 20px; }
  h1 { text-align: center; font-size: 28px; letter-spacing: 4px; margin: 0 0 4px; }
  .sub { text-align: center; font-size: 12px; color: #000; font-weight: 700; margin-bottom: 14px; }
  hr { border: 0; border-top: 1px dashed #bbb; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; font-weight: 700; color: #000; }
  .row b { font-weight: 800; }
  .big { font-size: 16px; font-weight: 800; }
  .label { color: #000; font-weight: 700; }
  .notes { font-size: 13px; background: #f5f5f5; padding: 8px; border-radius: 4px; white-space: pre-wrap; font-weight: 700; color: #000; }
  .footer { text-align: center; font-size: 12px; color: #000; font-weight: 700; margin-top: 16px; }
  @media print { body { padding: 0; } .receipt { border: none; } .no-print { display: none; } }
  .btns { text-align: center; margin-top: 16px; }
  .btns button { padding: 8px 16px; margin: 0 4px; cursor: pointer; }
</style></head><body>
<div class="receipt">
  <h1>VAIMOTO</h1>
  <div class="sub">Comprovante de Pagamento</div>
  <hr />
  <div class="row"><span class="label">Motoboy</span><b>${d.motoboyName}</b></div>
  <div class="row"><span class="label">Turno</span><span>${d.shift}</span></div>
  <div class="row"><span class="label">Data</span><span>${date} ${time}</span></div>
  <hr />
  <div class="row big"><span>Valor da Diária</span><span>${fmt(d.amount)}</span></div>
  <hr />
  <div class="label" style="font-size:12px;margin-bottom:4px;">Forma de Pagamento</div>
  ${methods.join("") || '<div class="row"><span>-</span></div>'}
  ${d.notes && d.notes.trim() ? `<hr /><div class="label" style="font-size:12px;margin-bottom:4px;">Observação</div><div class="notes">${d.notes.replace(/</g, "&lt;")}</div>` : ""}
  <div class="footer">Obrigado!</div>
</div>
<div class="btns no-print">
  <button onclick="window.print()">Imprimir</button>
  <button onclick="window.close()">Fechar</button>
</div>
<script>setTimeout(() => window.print(), 300);</script>
</body></html>`;

  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}