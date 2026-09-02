import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import logoHero from "@/assets/logo-hero.jpg.asset.json";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

const Header = ({ title, subtitle, showLogo }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        {showLogo && (
          <img
            src={logoHero.url}
            alt="Vai Moto"
            className="h-14 w-auto max-w-[40vw] object-contain sm:h-16"
          />
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-64 pl-9 bg-background"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
