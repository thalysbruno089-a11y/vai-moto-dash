import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Category, useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';
import { useCreateCashFlow } from '@/hooks/useCashFlow';

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const createCashFlow = useCreateCashFlow();
  const isLoading = createCategory.isPending || updateCategory.isPending || createCashFlow.isPending;
  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setValue(''); // No value when editing
    } else {
      setName('');
      setValue('');
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, name, type: 'expense' });
      } else {
        // Create category first
        const newCategory = await createCategory.mutateAsync({ name, type: 'expense' });
        
        // If value is provided, create a cash flow entry
        if (value && parseFloat(value) > 0) {
          await createCashFlow.mutateAsync({
            category_id: newCategory.id,
            type: 'expense',
            value: parseFloat(value),
            description: `Despesa: ${name}`,
            flow_date: new Date().toISOString().split('T')[0],
            is_recurring: false,
          });
        }
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite o nome da categoria.' 
              : 'Crie uma nova categoria e registre o valor da despesa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Energia, Água, Aluguel..."
              required
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="value">Valor da Despesa (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se não quiser registrar um valor agora.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !name}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
