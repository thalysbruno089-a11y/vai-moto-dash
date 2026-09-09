import MainLayout from "@/components/layout/MainLayout";
import { BurgazzoDeliveriesBoard } from "@/components/burgazzo/BurgazzoDeliveriesBoard";

const Burgazzo = () => {
  return (
    <MainLayout
      title="Burgazzo"
      subtitle="Relatórios recebidos da padaria Burgazzo — escolha a data no calendário"
    >
      <BurgazzoDeliveriesBoard editable={false} allowDateChange sentOnly />
    </MainLayout>
  );
};

export default Burgazzo;
