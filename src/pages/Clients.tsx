import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Phone, MapPin } from "lucide-react";

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  ordersCount: number;
}

const mockClients: Client[] = [
  { id: "1", name: "Restaurante Sabor", phone: "(11) 3456-7890", address: "Rua das Flores, 123 - Centro", notes: "Preferência por entrega rápida", ordersCount: 156 },
  { id: "2", name: "Farmácia Central", phone: "(11) 3567-8901", address: "Av. Brasil, 456 - Jardim", notes: "", ordersCount: 89 },
  { id: "3", name: "Loja Tech", phone: "(11) 3678-9012", address: "Rua do Comércio, 789 - Vila Nova", notes: "Entregas apenas no período da manhã", ordersCount: 45 },
  { id: "4", name: "Padaria Pão Quente", phone: "(11) 3789-0123", address: "Praça Central, 12 - Centro", notes: "", ordersCount: 234 },
  { id: "5", name: "Pet Shop Animal", phone: "(11) 3890-1234", address: "Rua dos Animais, 567 - Jardim", notes: "Produtos frágeis", ordersCount: 67 },
  { id: "6", name: "Livraria Cultura", phone: "(11) 3901-2345", address: "Av. Paulista, 1000 - Bela Vista", notes: "", ordersCount: 28 },
];

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = mockClients.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout title="Clientes" subtitle="Gerencie sua base de clientes">
      {/* Filters */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou endereço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1" />

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="border-border">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {client.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    {client.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-muted-foreground max-w-[250px]">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {client.notes || "-"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {client.ordersCount}
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
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
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
        Mostrando {filteredClients.length} de {mockClients.length} clientes
      </div>
    </MainLayout>
  );
};

export default Clients;
