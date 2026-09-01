import MainLayout from "@/components/layout/MainLayout";
import { LagoinhaDeliveriesBoard } from "@/components/lagoinha/LagoinhaDeliveriesBoard";

const Lagoinha = () => {
  return (
    <MainLayout
      title="Panificadora Lagoinha"
      subtitle="Relatórios recebidos da padaria Panificadora Lagoinha — escolha a data no calendário"
    >
      <LagoinhaDeliveriesBoard editable={false} allowDateChange sentOnly />
    </MainLayout>
  );
};

export default Lagoinha;
