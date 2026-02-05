import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Building2, User, Bell, Shield } from "lucide-react";
import UserManagement from "@/components/settings/UserManagement";

const Settings = () => {
  return (
    <MainLayout title="Configurações" subtitle="Gerencie as configurações do sistema">
      <div className="max-w-3xl space-y-8">
        {/* User Management */}
        <UserManagement />

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações do seu negócio</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input defaultValue="Empresa Demo" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input defaultValue="12.345.678/0001-90" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input defaultValue="(11) 3456-7890" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="contato@empresa.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input defaultValue="Rua das Empresas, 100 - Centro, São Paulo - SP" />
            </div>
            <Button>Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Minha Conta</CardTitle>
                <CardDescription>Configurações do seu perfil</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input defaultValue="Administrador" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" defaultValue="admin@empresa.com" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Alterar Senha</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" />
                </div>
              </div>
            </div>
            <Button>Atualizar Perfil</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure suas preferências de notificação</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Novos Pedidos</p>
                <p className="text-sm text-muted-foreground">Receber notificação quando um novo pedido for criado</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Pagamentos Pendentes</p>
                <p className="text-sm text-muted-foreground">Alertas sobre pagamentos em aberto</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recorrências Pendentes</p>
                <p className="text-sm text-muted-foreground">Notificar sobre transações recorrentes aguardando aprovação</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Relatórios Semanais</p>
                <p className="text-sm text-muted-foreground">Receber resumo semanal por email</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Configurações de segurança da conta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autenticação em Dois Fatores</p>
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sessões Ativas</p>
                <p className="text-sm text-muted-foreground">Gerencie dispositivos conectados</p>
              </div>
              <Button variant="outline" size="sm">Gerenciar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
