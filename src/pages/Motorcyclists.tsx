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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Power } from "lucide-react";

interface Motorcyclist {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  shift: "Diurno" | "Noturno" | "Final de Semana" | "Estrela" | "Livre";
  status: "active" | "inactive";
}

const mockMotorcyclists: Motorcyclist[] = [
  { id: "1", name: "João Silva", cpf: "123.456.789-00", phone: "(11) 99999-1234", shift: "Diurno", status: "active" },
  { id: "2", name: "Carlos Santos", cpf: "234.567.890-11", phone: "(11) 99999-2345", shift: "Diurno", status: "active" },
  { id: "3", name: "Pedro Lima", cpf: "345.678.901-22", phone: "(11) 99999-3456", shift: "Noturno", status: "active" },
  { id: "4", name: "Ana Costa", cpf: "456.789.012-33", phone: "(11) 99999-4567", shift: "Estrela", status: "active" },
  { id: "5", name: "Lucas Oliveira", cpf: "567.890.123-44", phone: "(11) 99999-5678", shift: "Final de Semana", status: "inactive" },
  { id: "6", name: "Maria Souza", cpf: "678.901.234-55", phone: "(11) 99999-6789", shift: "Livre", status: "active" },
  { id: "7", name: "Bruno Almeida", cpf: "789.012.345-66", phone: "(11) 99999-7890", shift: "Diurno", status: "active" },
  { id: "8", name: "Fernanda Reis", cpf: "890.123.456-77", phone: "(11) 99999-8901", shift: "Noturno", status: "inactive" },
];

const shiftColors: Record<string, string> = {
  "Diurno": "bg-primary/10 text-primary",
  "Noturno": "bg-purple-500/10 text-purple-600",
  "Final de Semana": "bg-orange-500/10 text-orange-600",
  "Estrela": "bg-yellow-500/10 text-yellow-600",
  "Livre": "bg-muted text-muted-foreground",
};

const Motorcyclists = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredMotorcyclists = mockMotorcyclists.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = shiftFilter === "all" || m.shift === shiftFilter;
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesShift && matchesStatus;
  });

  return (
    <MainLayout title="Motoboys" subtitle="Gerencie sua equipe de entregadores">
      {/* Filters */}
      <div className="filter-bar">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={shiftFilter} onValueChange={setShiftFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Turno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os turnos</SelectItem>
            <SelectItem value="Diurno">Diurno</SelectItem>
            <SelectItem value="Noturno">Noturno</SelectItem>
            <SelectItem value="Final de Semana">Final de Semana</SelectItem>
            <SelectItem value="Estrela">Estrela</SelectItem>
            <SelectItem value="Livre">Livre</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Motoboy
        </Button>
      </div>

      {/* Table */}
      <div className="data-table">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMotorcyclists.map((motorcyclist) => (
              <TableRow key={motorcyclist.id} className="border-border">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">
                        {motorcyclist.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    {motorcyclist.name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{motorcyclist.cpf}</TableCell>
                <TableCell className="text-muted-foreground">{motorcyclist.phone}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${shiftColors[motorcyclist.shift]}`}>
                    {motorcyclist.shift}
                  </span>
                </TableCell>
                <TableCell>
                  <BadgeStatus status={motorcyclist.status}>
                    {motorcyclist.status === "active" ? "Ativo" : "Inativo"}
                  </BadgeStatus>
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
                      <DropdownMenuItem>
                        <Power className="mr-2 h-4 w-4" />
                        {motorcyclist.status === "active" ? "Desativar" : "Ativar"}
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
        Mostrando {filteredMotorcyclists.length} de {mockMotorcyclists.length} motoboys
      </div>
    </MainLayout>
  );
};

export default Motorcyclists;
