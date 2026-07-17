import MainLayout from "@/components/layout/MainLayout";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";

const Ultra = () => {
  return (
    <MainLayout title="ULTRA" subtitle="Relatórios recebidos da equipe ULTRA">
      <UltraDeliveriesBoard editable={false} allowDateChange sentOnly />
    </MainLayout>
  );
};

export default Ultra;