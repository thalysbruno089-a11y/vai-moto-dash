import logo from "@/assets/logo.png";

interface QueueBrandProps {
  compact?: boolean;
  inverted?: boolean;
}

export function QueueBrand({ compact = false, inverted = false }: QueueBrandProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-card p-1 sm:h-16 sm:w-24">
        <img src={logo} alt="Vai Moto" className="h-full w-full object-contain" />
      </div>
      <div>
        <p className={`font-bold ${compact ? "text-lg" : "text-xl sm:text-2xl"} ${inverted ? "text-primary-foreground" : "text-foreground"}`}>Vai Moto SSP</p>
        <p className={`text-xs font-semibold uppercase ${inverted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>Sistema de Chamada</p>
      </div>
    </div>
  );
}