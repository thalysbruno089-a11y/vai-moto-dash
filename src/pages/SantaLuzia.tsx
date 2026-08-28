import MainLayout from "@/components/layout/MainLayout";
import { SantaLuziaDeliveriesBoard } from "@/components/santaluzia/SantaLuziaDeliveriesBoard";

const SantaLuzia = () => {
  return (
    <MainLayout
      title="Santa Luzia"
      subtitle="Relatórios recebidos da padaria Santa Luzia — escolha a data no calendário"
    >
      <SantaLuziaDeliveriesBoard editable={false} allowDateChange sentOnly />
    </MainLayout>
  );
};

export default SantaLuzia;
