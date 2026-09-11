import {
  Banknote,
  Bike,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileText,
  Hash,
  MapPin,
  Pencil,
  Phone,
  UserRound,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Motoboy } from "@/hooks/useMotoboys";
import { Database } from "@/integrations/supabase/types";

type ShiftType = Database["public"]["Enums"]["shift_type"];

const shiftLabels: Record<ShiftType, string> = {
  day: "Diurno",
  night: "Noturno",
  weekend: "Final de Semana",
  star: "Estrelinha",
  free: "Free",
};

interface MotoboyDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motoboy: Motoboy | null;
  onEdit: (motoboy: Motoboy) => void;
}

interface DetailItemProps {
  icon: typeof UserRound;
  label: string;
  value: string | null | undefined;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="min-w-0 border-b border-border py-3 last:border-b-0">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>
      <p className="break-words pl-6 text-sm font-semibold text-foreground">{value || "Não informado"}</p>
    </div>
  );
}

export function MotoboyDetailsSheet({ open, onOpenChange, motoboy, onEdit }: MotoboyDetailsSheetProps) {
  if (!motoboy) return null;

  const paymentStatus = motoboy.payment_status === "paid";
  const isActive = motoboy.status === "active";
  const weeklyPayment = Number(motoboy.weekly_payment || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pr-8 text-left">
          <SheetTitle>Ficha do motoboy</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <div className="flex items-center gap-4 border-b border-border pb-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {motoboy.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-xl font-bold text-foreground">{motoboy.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Motoboy nº {motoboy.number || "não informado"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-border py-5">
            <div className={`rounded-md border p-3 ${isActive ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}>
              <p className="text-xs font-medium text-muted-foreground">Cadastro</p>
              <div className={`mt-1 flex items-center gap-2 text-sm font-bold ${isActive ? "text-success" : "text-destructive"}`}>
                {isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {isActive ? "Ativo" : "Inativo"}
              </div>
            </div>
            <div className={`rounded-md border p-3 ${paymentStatus ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}>
              <p className="text-xs font-medium text-muted-foreground">Pagamento</p>
              <div className={`mt-1 flex items-center gap-2 text-sm font-bold ${paymentStatus ? "text-success" : "text-destructive"}`}>
                {paymentStatus ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {paymentStatus ? "Pago" : "Não pago"}
              </div>
            </div>
          </div>

          <div className="py-2">
            <DetailItem icon={Hash} label="Número" value={motoboy.number} />
            <DetailItem icon={UserRound} label="CPF" value={motoboy.cpf} />
            <DetailItem icon={Phone} label="Telefone" value={motoboy.phone} />
            <DetailItem icon={MapPin} label="Endereço" value={motoboy.address} />
            <DetailItem icon={CreditCard} label="Chave PIX" value={motoboy.pix_key} />
            <DetailItem icon={Bike} label="Placa da moto" value={motoboy.plate} />
            <DetailItem icon={FileText} label="RENAVAM" value={motoboy.renavam} />
            <DetailItem icon={CalendarDays} label="Turno" value={shiftLabels[motoboy.shift]} />
            <DetailItem icon={CircleDollarSign} label="Valor semanal" value={weeklyPayment} />
            <DetailItem
              icon={Banknote}
              label="Data do cadastro"
              value={new Date(motoboy.created_at).toLocaleDateString("pt-BR")}
            />
          </div>

          <Button type="button" className="mt-4 w-full" onClick={() => onEdit(motoboy)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar dados
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}