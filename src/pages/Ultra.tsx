import MainLayout from "@/components/layout/MainLayout";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Archive } from "lucide-react";

const Ultra = () => {
  return (
    <MainLayout title="ULTRA" subtitle="Relatórios recebidos da equipe ULTRA">
      <Tabs defaultValue="today" className="md:flex md:gap-6 md:items-start">
        <TabsList className="md:flex md:flex-col md:h-auto md:w-48 md:shrink-0 md:bg-muted/40 md:p-2 md:gap-1">
          <TabsTrigger value="today" className="md:w-full md:justify-start gap-2">
            <CalendarDays className="h-4 w-4" /> Pedidos do dia
          </TabsTrigger>
          <TabsTrigger value="saved" className="md:w-full md:justify-start gap-2">
            <Archive className="h-4 w-4" /> Salvos
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 min-w-0 mt-4 md:mt-0">
          <TabsContent value="today" className="mt-0">
            <UltraDeliveriesBoard editable={false} sentOnly />
          </TabsContent>
          <TabsContent value="saved" className="mt-0">
            <UltraDeliveriesBoard editable={false} allowDateChange sentOnly />
          </TabsContent>
        </div>
      </Tabs>
    </MainLayout>
  );
};

export default Ultra;