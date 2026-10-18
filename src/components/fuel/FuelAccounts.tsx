import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select,SelectTrigger,SelectValue,SelectContent,SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
export default function FuelAccounts({companyId}:{companyId:string}){
 const [kind,setKind]=useState('fuel_rider');const [search,setSearch]=useState('');const [selected,setSelected]=useState('');const [username,setUsername]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [resetId,setResetId]=useState('');
 const riders=useQuery({queryKey:['fuel-admin-riders',companyId],queryFn:async()=>{const {data,error}=await supabase.from('motoboys').select('id,name,number,plate').eq('company_id',companyId).order('name');if(error)throw error;return data;}});
 const accounts=useQuery({queryKey:['fuel-accounts',companyId],queryFn:async()=>{const {data,error}=await supabase.from('fuel_accounts').select('*').eq('company_id',companyId).order('created_at',{ascending:false});if(error)throw error;return data;}});
 async function save(e:React.FormEvent){e.preventDefault();if(!resetId&&kind==='fuel_rider'&&!selected){toast.error('Selecione um motoboy');return;}setBusy(true);try{
 const {data,error}=await supabase.functions.invoke('fuel-manage-access',{body:{kind,username,password,...(selected?{motoboyId:selected}:{}),...(resetId?{userId:resetId}:{})}});
 if(error||data?.error)throw new Error(data?.error??'Não foi possível salvar. Confira login e senha.');toast.success(resetId?'Senha redefinida':'Acesso criado');setUsername('');setPassword('');setSelected('');setResetId('');await accounts.refetch();
 }catch(e){toast.error(e instanceof Error?e.message:'Erro ao salvar');}finally{setBusy(false);}}
 return <div className="grid gap-8 lg:grid-cols-2"><form onSubmit={save} className="space-y-4"><h2 className="text-lg font-semibold">{resetId?'Redefinir senha':'Cadastrar acesso'}</h2>
 {!resetId&&<><Label>Tipo de acesso</Label><Select value={kind} onValueChange={v=>{setKind(v);setSelected('');}}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="fuel_rider">Motoboy</SelectItem><SelectItem value="fuel_station">Administrador do posto</SelectItem></SelectContent></Select>
 {kind==='fuel_rider'&&<><Input aria-label="Buscar motoboy cadastrado" placeholder="Pesquisar nome ou código" value={search} onChange={e=>setSearch(e.target.value)}/><Select value={selected} onValueChange={setSelected}><SelectTrigger><SelectValue placeholder="Selecionar motoboy cadastrado"/></SelectTrigger><SelectContent>{riders.data?.filter(m=>`${m.name} ${m.number}`.toLowerCase().includes(search.toLowerCase())).map(m=><SelectItem key={m.id} value={m.id}>{m.number??'—'} · {m.name}</SelectItem>)}</SelectContent></Select></>}
 </>}
 <div className="space-y-2"><Label htmlFor="fuel-user">Login</Label><Input id="fuel-user" value={username} disabled={!!resetId} onChange={e=>setUsername(e.target.value.toLowerCase())} pattern="[a-z0-9._\-]{3,40}" required autoComplete="off"/></div>
 <div className="space-y-2"><Label htmlFor="fuel-password">{resetId?'Nova senha':'Senha'}</Label><Input id="fuel-password" type="password" minLength={8} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"/></div>
 <div className="flex gap-2"><Button disabled={busy}>{busy?'Salvando…':resetId?'Salvar nova senha':'Criar acesso'}</Button>{resetId&&<Button type="button" variant="outline" onClick={()=>{setResetId('');setUsername('');setPassword('');}}>Cancelar</Button>}</div></form>
 <section><h2 className="mb-4 text-lg font-semibold">Acessos cadastrados</h2>{accounts.isError?<p className="text-destructive">Não foi possível carregar os acessos.</p>:!accounts.data?.length?<p className="text-muted-foreground">Nenhum acesso cadastrado.</p>:<div className="divide-y">{accounts.data.map(a=><div key={a.user_id} className="flex flex-wrap justify-between gap-3 py-3"><div><p className="font-semibold">{a.username}</p><p className="text-sm text-muted-foreground">{a.motoboy_id?riders.data?.find(m=>m.id===a.motoboy_id)?.name??'Motoboy':'Administrador do posto'}</p></div><Button variant="outline" onClick={()=>{setResetId(a.user_id);setUsername(a.username);setKind(a.motoboy_id?'fuel_rider':'fuel_station');setPassword('');}}>Redefinir senha</Button></div>)}</div>}</section></div>;
}
