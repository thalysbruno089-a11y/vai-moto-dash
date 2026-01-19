import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeStatus } from "@/components/ui/badge-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, Package } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  client: string;
  motorcyclist: string;
  address: string;
  value: string;
  status: "pending" | "in_transit" | "delivered" | "cancelled";
  createdAt: string;
}

const mockOrders: Order[] = [
  { id: "1", orderNumber: "#1234", client: "Restaurante Sabor", motorcyclist: "João Silva", address: "Rua das Flores, 123", value: "R$ 25,00", status: "delivered", createdAt: "19/01/2025 14:30" },
  { id: "2", orderNumber: "#1235", client: "Farmácia Central", motorcyclist: "Carlos Santos", address: "Av. Brasil, 456", value: "R$ 18,00", status: "in_transit", createdAt: "19/01/2025 14:25" },
  { id: "3", orderNumber: "#1236", client: "Loja Tech", motorcyclist: "Pedro Lima", address: "Rua do Comércio, 789", value: "R$ 35,00", status: "pending", createdAt: "19/01/2025 14:20" },
  { id: "4", orderNumber: "#1237", client: "Padaria Pão Quente", motorcyclist: "Ana Costa", address: "Praça Central, 12", value: "R$ 12,00", status: "delivered", createdAt: "19/01/2025 14:15" },
  { id: "5", orderNumber: "#1238", client: "Pet Shop Animal", motorcyclist: "Lucas Oliveira", address: "Rua dos Animais, 567", value: "R$ 28,00", status: "in_transit", createdAt: "19/01/2025 14:10" },
  { id: "6", orderNumber: "#1239", client: "Livraria Cultura", motorcyclist: "-", address: "Av. Paulista, 1000", value: "R$ 22,00", status: "pending", createdAt: "19/01/2025 14:05" },
  { id: "7", orderNumber: "#1240", client: "Restaurante Sabor", motorcyclist: "Bruno Almeida", address: "Rua das Flores, 123", value: "R$ 45,00", status: "cancelled", createdAt: "19/01/2025 14:00" },
];

const statusLabels: Record<string, string> = {
  pending: "Aguardando",
  in_transit: "Em trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusVariants: Record<string, "pending" | "warning" | "success" | "error"> = {
  pending: "pending",
  in_transit: "warning",
  delivered: "success",
  cancelled: "error",
};

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = mockOrders.filter((o) => {
    const matchesSearch = 
      o.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.motorcyclist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout title="Pedidos" subtitle="Gerencie os pedidos de entrega">
      {/* Filters */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, pedido ou motoboy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Aguardando</SelectItem>
            <SelectItem value="in_transit">Em trânsito</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Motoboy</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="border-border">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    {order.orderNumber}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{order.client}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {order.address}
                </TableCell>
                <TableCell className="text-muted-foreground">{order.motorcyclist}</TableCell>
                <TableCell className="text-right font-semibold">{order.value}</TableCell>
                <TableCell>
                  <BadgeStatus status={statusVariants[order.status]}>
                    {statusLabels[order.status]}
                  </BadgeStatus>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {order.createdAt}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancelar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {filteredOrders.length} de {mockOrders.length} pedidos
      </div>
    </MainLayout>
  );
};

export default Orders;
