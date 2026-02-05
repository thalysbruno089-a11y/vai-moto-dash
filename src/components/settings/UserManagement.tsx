import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type UserRole = 'admin' | 'manager' | 'finance' | 'employee';

interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  finance: 'Financeiro',
  employee: 'Funcionária',
};

const roleAccess: Record<string, string[]> = {
  admin: ['Dashboard', 'Motoboys', 'Clientes', 'Contas', 'Fluxo de Caixa', 'Categorias', 'Relatórios', 'Configurações'],
  manager: ['Dashboard', 'Motoboys', 'Clientes', 'Contas', 'Fluxo de Caixa', 'Categorias', 'Relatórios'],
  finance: ['Dashboard', 'Motoboys', 'Clientes', 'Contas', 'Fluxo de Caixa', 'Categorias', 'Relatórios'],
  employee: ['Clientes'],
};

const UserManagement = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'employee' as UserRole,
  });

  useEffect(() => {
    fetchUsers();
  }, [profile?.company_id]);

  const fetchUsers = async () => {
    if (!profile?.company_id) return;
    
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('company_id', profile.company_id);

    if (!error && data) {
      setUsers(data as UserProfile[]);
    }
    setLoadingUsers(false);
  };

  const handleCreate = async () => {
    if (!profile?.company_id) {
      toast.error("Empresa não encontrada");
      return;
    }

    if (formData.username.length < 3) {
      toast.error("Usuário deve ter no mínimo 3 caracteres");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('seed-users', {
        body: {
          users: [{
            username: formData.username,
            password: formData.password,
            name: formData.name,
            role: formData.role,
          }]
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Usuário ${formData.name} criado com sucesso!`);
        setFormData({ username: '', password: '', name: '', role: 'employee' });
        fetchUsers();
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Acesso atualizado com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar acesso');
    }
  };

  return (
    <div className="space-y-6">
      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Controle de Acesso</CardTitle>
              <CardDescription>Gerencie os acessos de cada usuário</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{user.name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {roleAccess[user.role]?.map((access) => (
                        <Badge key={access} variant="secondary" className="text-xs">
                          {access}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Select
                      value={user.role}
                      onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                      disabled={user.id === profile?.id}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                        <SelectItem value="manager">{roleLabels.manager}</SelectItem>
                        <SelectItem value="finance">{roleLabels.finance}</SelectItem>
                        <SelectItem value="employee">{roleLabels.employee}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New User */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Adicionar Usuário</CardTitle>
              <CardDescription>Crie novos usuários para o sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Usuário (login)</Label>
              <Input
                placeholder="ex: joyce"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
              />
              <p className="text-xs text-muted-foreground">Será usado como {formData.username || 'usuario'}@vaimoto.app</p>
            </div>
            <div className="space-y-2">
              <Label>Senha (mínimo 8 caracteres)</Label>
              <Input
                type="password"
                placeholder="********"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                placeholder="ex: Joyce Silva"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={formData.role}
                onValueChange={(value: UserRole) => 
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                  <SelectItem value="manager">{roleLabels.manager}</SelectItem>
                  <SelectItem value="finance">{roleLabels.finance}</SelectItem>
                  <SelectItem value="employee">{roleLabels.employee}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Usuário
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
