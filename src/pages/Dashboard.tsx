import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Package, Users, Bike } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <MainLayout title="Dashboard" subtitle="Visão geral da sua empresa">
      {/* Financial Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Saldo Atual"
          value="R$ 45.250,00"
          icon={<Wallet className="h-6 w-6 text-primary" />}
          variant="primary"
        />
        <StatCard
          title="Total de Entradas"
          value="R$ 128.500,00"
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          trend={{ value: "12%", positive: true }}
          variant="success"
        />
        <StatCard
          title="Total de Saídas"
          value="R$ 83.250,00"
          icon={<TrendingDown className="h-6 w-6 text-destructive" />}
          trend={{ value: "5%", positive: false }}
          variant="destructive"
        />
        <StatCard
          title="Balanço Mensal"
          value="R$ 45.250,00"
          icon={<PiggyBank className="h-6 w-6 text-primary" />}
          trend={{ value: "8%", positive: true }}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <StatCard
          title="Pedidos Hoje"
          value="47"
          icon={<Package className="h-6 w-6 text-primary" />}
          trend={{ value: "15%", positive: true }}
        />
        <StatCard
          title="Clientes Ativos"
          value="234"
          icon={<Users className="h-6 w-6 text-primary" />}
          trend={{ value: "8", positive: true }}
        />
        <StatCard
          title="Motoboys Ativos"
          value="18"
          icon={<Bike className="h-6 w-6 text-primary" />}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: "#1234", client: "Restaurante Sabor", value: "R$ 25,00", status: "Entregue", motoboy: "João Silva" },
                { id: "#1233", client: "Farmácia Central", value: "R$ 18,00", status: "Em trânsito", motoboy: "Carlos Santos" },
                { id: "#1232", client: "Loja Tech", value: "R$ 35,00", status: "Aguardando", motoboy: "Pedro Lima" },
                { id: "#1231", client: "Padaria Pão Quente", value: "R$ 12,00", status: "Entregue", motoboy: "Ana Costa" },
              ].map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.client}</p>
                      <p className="text-sm text-muted-foreground">{order.id} • {order.motoboy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{order.value}</p>
                    <p className={`text-sm ${
                      order.status === "Entregue" 
                        ? "text-success" 
                        : order.status === "Em trânsito" 
                          ? "text-warning" 
                          : "text-muted-foreground"
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Motoboys em Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "João Silva", shift: "Diurno", deliveries: 12, status: "online" },
                { name: "Carlos Santos", shift: "Diurno", deliveries: 8, status: "online" },
                { name: "Pedro Lima", shift: "Noturno", deliveries: 5, status: "busy" },
                { name: "Ana Costa", shift: "Estrela", deliveries: 15, status: "online" },
              ].map((motoboy) => (
                <div key={motoboy.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {motoboy.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                        motoboy.status === "online" ? "bg-success" : "bg-warning"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{motoboy.name}</p>
                      <p className="text-sm text-muted-foreground">{motoboy.shift}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{motoboy.deliveries}</p>
                    <p className="text-sm text-muted-foreground">entregas</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
