import { useState } from 'react';
import { Navigate,Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFuelAccess,useFuelData } from '@/hooks/useFuel';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs,TabsList,TabsTrigger,TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Fuel as FuelIcon,LogOut,ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { moneyInput,fuelMoney } from '@/lib/fuel';
import FuelAccounts from '@/components/fuel/FuelAccounts';
import FuelRecords from '@/components/fuel/FuelRecords';
import FuelRider from '@/components/fuel/FuelRider';
import logo from '@/assets/logo.png';
function FuelPanel({companyId,admin}:{companyId:string;admin:boolean}){
 const {price,fillings}=useFuelData(companyId);const [value,setValue]=useState('');const [busy,setBusy]=useState(false);
 async function save(e:React.FormEvent){e.preventDefault();const n=moneyInput(value);if(!Number.isFinite(n)||n<=0||n>100){toast.error('Informe um preço válido entre R$ 0,001 e R$ 100');return;}setBusy(true);const {error}=await supabase.from('fuel_prices').upsert({company_id:companyId,price:n,updated_at:new Date().toISOString()});setBusy(false);if(error)toast.error('Não foi possível salvar o preço');else{toast.success('Preço do litro atualizado');setValue('');price.refetch();}}
 return <Tabs defaultValue="records"><TabsList className="mb-5 flex h-auto flex-wrap justify-start">{admin&&<TabsTrigger value="accounts">Acessos</TabsTrigger>}<TabsTrigger value="records">{admin?'Fotos e comprovantes':'Abastecimentos'}</TabsTrigger>{admin&&<TabsTrigger value="consumption">Consumo por motoboy</TabsTrigger>}<TabsTrigger value="price">Preço do litro</TabsTrigger></TabsList>
 {admin&&<TabsContent value="accounts"><FuelAccounts companyId={companyId}/></TabsContent>}
 <TabsContent value="records">{fillings.isLoading?<p>Carregando abastecimentos…</p>:fillings.isError?<p className="text-destructive">Não foi possível carregar abastecimentos.</p>:<FuelRecords rows={fillings.data??[]}/>}</TabsContent>
 <TabsContent value="consumption"><FuelRecords rows={fillings.data??[]} consumption/></TabsContent>
 <TabsContent value="price"><form onSubmit={save} className="max-w-sm space-y-4"><h2 className="text-xl font-semibold">Gasolina</h2><p className="text-muted-foreground">Preço atual: {price.data?`${fuelMoney(Number(price.data.price))}/L`:'Não configurado'}</p><Label htmlFor="liter-price">Novo preço do litro (R$)</Label><Input id="liter-price" inputMode="decimal" value={value} onChange={e=>setValue(e.target.value)} placeholder="0,00" required/><Button disabled={busy}>{busy?'Salvando…':'Salvar preço'}</Button></form></TabsContent>
 </Tabs>;
}
export default function Fuel(){
 const {user,profile,loading,signOut}=useAuth();const access=useFuelAccess();
 if(loading||access.isLoading)return <p className="p-8">Carregando…</p>;
 if(!user)return <Navigate to="/posto/entrar" replace/>;
 if(access.isError)return <p className="p-8 text-destructive">Não foi possível verificar o acesso.</p>;
 if(!access.data&&profile?.role!=='admin')return <Navigate to="/" replace/>;
 if(!access.data&&profile?.company_id)return <MainLayout title="Posto de Gasolina"><Tabs defaultValue="admin"><TabsList className="mb-6 flex h-auto flex-wrap"><TabsTrigger value="admin">ADM Carlos</TabsTrigger><TabsTrigger value="rider">Dos Motoboy</TabsTrigger><TabsTrigger value="station">ADM do posto</TabsTrigger></TabsList><TabsContent value="admin"><FuelPanel companyId={profile.company_id} admin/></TabsContent><TabsContent value="rider"><Button asChild variant="outline"><Link to="/posto/entrar"><ExternalLink className="mr-2 h-4 w-4"/>Abrir acesso do motoboy</Link></Button></TabsContent><TabsContent value="station"><Button asChild variant="outline"><Link to="/posto/entrar"><ExternalLink className="mr-2 h-4 w-4"/>Abrir acesso do posto</Link></Button></TabsContent></Tabs></MainLayout>;
 if(!access.data)return <p>Empresa não encontrada.</p>;
 return <div className="min-h-screen bg-background"><header className="border-b bg-card"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4"><div className="flex items-center gap-3"><img src={logo} alt="Vai Moto" className="h-9 w-20 object-contain"/><h1 className="text-lg font-semibold"><FuelIcon className="mr-2 inline h-5 w-5"/>Posto</h1></div><Button variant="ghost" size="icon" aria-label="Sair" onClick={()=>signOut()}><LogOut className="h-5 w-5"/></Button></div></header><main className="mx-auto max-w-5xl px-4 py-6">{access.data.motoboy_id?<FuelRider companyId={access.data.company_id} userId={user.id}/>:<><h2 className="mb-6 text-2xl font-semibold">Painel do posto</h2><FuelPanel companyId={access.data.company_id} admin={false}/></>}</main></div>;
}
