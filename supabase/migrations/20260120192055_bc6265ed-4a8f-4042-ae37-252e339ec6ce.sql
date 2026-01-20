-- Enum para tipos de turno
CREATE TYPE public.shift_type AS ENUM ('day', 'night', 'weekend', 'star', 'free');

-- Enum para status
CREATE TYPE public.status_type AS ENUM ('active', 'inactive');

-- Enum para tipo de fluxo de caixa
CREATE TYPE public.flow_type AS ENUM ('revenue', 'expense');

-- Enum para status de pagamento
CREATE TYPE public.payment_status AS ENUM ('paid', 'pending');

-- Enum para status de pedido
CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'delivered', 'cancelled');

-- Enum para cargos
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'finance');

-- Tabela Company (Empresa)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela Profiles (Perfis de usuário)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela Motoboys
CREATE TABLE public.motoboys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  shift shift_type NOT NULL DEFAULT 'day',
  status status_type NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela Clients (Clientes)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela Categories (Categorias)
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type flow_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela Orders (Pedidos)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  motoboy_id UUID REFERENCES public.motoboys(id) ON DELETE SET NULL,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela Cash Flow (Fluxo de Caixa)
CREATE TABLE public.cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  value DECIMAL(10,2) NOT NULL,
  flow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  type flow_type NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela Payments (Pagamentos)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  motoboy_id UUID REFERENCES public.motoboys(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Função helper para obter company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Função helper para verificar se usuário tem acesso à empresa
CREATE OR REPLACE FUNCTION public.has_company_access(target_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND company_id = target_company_id
  )
$$;

-- Função helper para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_motoboys_updated_at BEFORE UPDATE ON public.motoboys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cash_flow_updated_at BEFORE UPDATE ON public.cash_flow FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoboys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para COMPANIES
CREATE POLICY "Users can view their company" ON public.companies
  FOR SELECT USING (public.has_company_access(id));

CREATE POLICY "Users can update their company" ON public.companies
  FOR UPDATE USING (public.has_company_access(id));

-- RLS Policies para PROFILES
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- RLS Policies para MOTOBOYS
CREATE POLICY "Users can view motoboys in their company" ON public.motoboys
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Users can insert motoboys in their company" ON public.motoboys
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Users can update motoboys in their company" ON public.motoboys
  FOR UPDATE USING (public.has_company_access(company_id));

CREATE POLICY "Users can delete motoboys in their company" ON public.motoboys
  FOR DELETE USING (public.has_company_access(company_id));

-- RLS Policies para CLIENTS
CREATE POLICY "Users can view clients in their company" ON public.clients
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Users can insert clients in their company" ON public.clients
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Users can update clients in their company" ON public.clients
  FOR UPDATE USING (public.has_company_access(company_id));

CREATE POLICY "Users can delete clients in their company" ON public.clients
  FOR DELETE USING (public.has_company_access(company_id));

-- RLS Policies para CATEGORIES
CREATE POLICY "Users can view categories in their company" ON public.categories
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Users can insert categories in their company" ON public.categories
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Users can update categories in their company" ON public.categories
  FOR UPDATE USING (public.has_company_access(company_id));

CREATE POLICY "Users can delete categories in their company" ON public.categories
  FOR DELETE USING (public.has_company_access(company_id));

-- RLS Policies para ORDERS
CREATE POLICY "Users can view orders in their company" ON public.orders
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Users can insert orders in their company" ON public.orders
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Users can update orders in their company" ON public.orders
  FOR UPDATE USING (public.has_company_access(company_id));

CREATE POLICY "Users can delete orders in their company" ON public.orders
  FOR DELETE USING (public.has_company_access(company_id));

-- RLS Policies para CASH_FLOW
CREATE POLICY "Users can view cash_flow in their company" ON public.cash_flow
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Users can insert cash_flow in their company" ON public.cash_flow
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Users can update cash_flow in their company" ON public.cash_flow
  FOR UPDATE USING (public.has_company_access(company_id));

CREATE POLICY "Users can delete cash_flow in their company" ON public.cash_flow
  FOR DELETE USING (public.has_company_access(company_id));

-- RLS Policies para PAYMENTS
CREATE POLICY "Users can view payments in their company" ON public.payments
  FOR SELECT USING (public.has_company_access(company_id));

CREATE POLICY "Users can insert payments in their company" ON public.payments
  FOR INSERT WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Users can update payments in their company" ON public.payments
  FOR UPDATE USING (public.has_company_access(company_id));

CREATE POLICY "Users can delete payments in their company" ON public.payments
  FOR DELETE USING (public.has_company_access(company_id));

-- Criar índices para performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_motoboys_company_id ON public.motoboys(company_id);
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_categories_company_id ON public.categories(company_id);
CREATE INDEX idx_orders_company_id ON public.orders(company_id);
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_motoboy_id ON public.orders(motoboy_id);
CREATE INDEX idx_cash_flow_company_id ON public.cash_flow(company_id);
CREATE INDEX idx_cash_flow_category_id ON public.cash_flow(category_id);
CREATE INDEX idx_payments_company_id ON public.payments(company_id);
CREATE INDEX idx_payments_motoboy_id ON public.payments(motoboy_id);