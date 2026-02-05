import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  finance: 'Financeiro',
  employee: 'Funcionária',
};

const UserManagement = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'employee' as 'admin' | 'manager' | 'finance' | 'employee',
  });

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>Adicione novos usuários ao sistema</CardDescription>
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
              onValueChange={(value: 'admin' | 'manager' | 'finance' | 'employee') => 
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
  );
};

export default UserManagement;
