import MainLayout from "@/components/layout/MainLayout";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

const Ultra = () => {
  return (
    <MainLayout title="ULTRA" subtitle="Relatórios recebidos da equipe ULTRA">
      <div className="flex justify-end mb-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Archive className="h-4 w-4 mr-2" /> Salvos
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Relatórios salvos</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <UltraDeliveriesBoard editable={false} allowDateChange sentOnly />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <UltraDeliveriesBoard editable={false} sentOnly />
    </MainLayout>
  );
};

export default Ultra;