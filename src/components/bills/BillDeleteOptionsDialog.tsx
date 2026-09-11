import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarX, CalendarClock, Trash2 } from "lucide-react";

export type BillDeleteScope = "only_this" | "this_and_next" | "all";

interface BillDeleteOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billName: string;
  monthLabel: string;
  isLoading?: boolean;
  onConfirm: (scope: BillDeleteScope) => void;
}

export function BillDeleteOptionsDialog({
  open,
  onOpenChange,
  billName,
  monthLabel,
  isLoading,
  onConfirm,
}: BillDeleteOptionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Excluir — {billName}</DialogTitle>
          <DialogDescription>
            Escolha o que deseja excluir. Os meses anteriores continuam salvos, exceto na última opção.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            disabled={isLoading}
            onClick={() => onConfirm("only_this")}
          >
            <CalendarX className="h-4 w-4 mr-3 shrink-0 text-amber-500" />
            <span className="text-left">
              <span className="block font-semibold">Excluir apenas esta</span>
              <span className="block text-xs text-muted-foreground">Some só em {monthLabel}</span>
            </span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            disabled={isLoading}
            onClick={() => onConfirm("this_and_next")}
          >
            <CalendarClock className="h-4 w-4 mr-3 shrink-0 text-primary" />
            <span className="text-left">
              <span className="block font-semibold">Excluir esta e as próximas</span>
              <span className="block text-xs text-muted-foreground">Mantém o histórico dos meses anteriores</span>
            </span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            disabled={isLoading}
            onClick={() => onConfirm("all")}
          >
            <Trash2 className="h-4 w-4 mr-3 shrink-0" />
            <span className="text-left">
              <span className="block font-semibold">Excluir tudo</span>
              <span className="block text-xs opacity-80">Apaga também os meses anteriores</span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
