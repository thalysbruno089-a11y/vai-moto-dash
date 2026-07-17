import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";
import logo from "@/assets/logo.png";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Archive } from "lucide-react";

const UltraRegistro = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Vai Moto" className="h-9 w-auto" />
            <div>
              <h1 className="text-lg font-bold leading-none">ULTRA</h1>
              <p className="text-xs text-muted-foreground">Registro de entregas</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-4">
        <Tabs defaultValue="today" className="md:flex md:gap-6 md:items-start">
          <TabsList className="w-full md:flex md:flex-col md:h-auto md:w-48 md:shrink-0 md:bg-muted/40 md:p-2 md:gap-1">
            <TabsTrigger value="today" className="flex-1 md:w-full md:justify-start gap-2">
              <CalendarDays className="h-4 w-4" /> Pedidos do dia
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 md:w-full md:justify-start gap-2">
              <Archive className="h-4 w-4" /> Salvos
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 min-w-0 mt-4 md:mt-0">
            <TabsContent value="today" className="mt-0">
              <UltraDeliveriesBoard editable />
            </TabsContent>
            <TabsContent value="saved" className="mt-0">
              <UltraDeliveriesBoard editable={false} allowDateChange sentOnly />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default UltraRegistro;