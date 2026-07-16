import MainLayout from "@/components/layout/MainLayout";
import { UltraDeliveriesBoard } from "@/components/ultra/UltraDeliveriesBoard";

const Ultra = () => {
  return (
    <MainLayout title="ULTRA" subtitle="Entregas registradas pelo ULTRA">
      <UltraDeliveriesBoard allowDateChange />
    </MainLayout>
  );
};

export default Ultra;