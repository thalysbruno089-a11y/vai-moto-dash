import { useRef,useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFuelData } from '@/hooks/useFuel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs,TabsList,TabsTrigger,TabsContent } from '@/components/ui/tabs';
import { UserRound,Camera,CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { fillingSchema,moneyInput,fuelLiters,fuelMoney } from '@/lib/fuel';
import FuelRecords from './FuelRecords';
export default function FuelRider({companyId,userId}:{companyId:string;userId:string}){
 const {price,fillings}=useFuelData(companyId);const [amount,setAmount]=useState('');const [discount,setDiscount]=useState('');const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false);const [confirmed,setConfirmed]=useState(false);const fileInput=useRef<HTMLInputElement>(null);const [pendingId,setPendingId]=useState<string|null>(null);
 const rider=useQuery({queryKey:['fuel-rider',userId],refetchInterval:10000,refetchOnWindowFocus:'always',queryFn:async()=>{const {data,error}=await supabase.rpc('fuel_rider_details');if(error)throw error;return data[0]??null;}});
 const liters=fuelLiters(moneyInput(amount),discount?moneyInput(discount):0,Number(price.data?.price??0));
 async function submit(e:React.FormEvent){e.preventDefault();const parsed=fillingSchema.safeParse({amount:moneyInput(amount),discount:discount?moneyInput(discount):0});if(!parsed.success){toast.error('Confira o valor e o desconto');return;}if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){toast.error('Envie uma foto JPG, PNG ou WEBP de até 10 MB');return;}if(!rider.data||!price.data)return;
 setBusy(true);setConfirmed(false);const id=pendingId??crypto.randomUUID();setPendingId(id);const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=`${userId}/${id}.${ext}`;
 try{
 const {data:existing,error:readError}=await supabase.from('fuel_fillings').select('id').eq('id',id).maybeSingle();if(readError)throw readError;
 if(!existing){const {error:uploadError}=await supabase.storage.from('fuel-receipts').upload(path,file,{contentType:file.type});if(uploadError&&!uploadError.message.toLowerCase().includes('already exists')&&!uploadError.message.toLowerCase().includes('duplicate'))throw uploadError;
 const {error}=await supabase.from('fuel_fillings').insert({id,company_id:companyId,user_id:userId,motoboy_id:rider.data.id,amount:parsed.data.amount,discount:parsed.data.discount,receipt_path:path});if(error)throw error;}
 setConfirmed(true);toast.success('Abastecimento registrado e aprovado');setPendingId(null);setAmount('');setDiscount('');setFile(null);if(fileInput.current)fileInput.current.value='';await fillings.refetch();
 }catch(e){toast.error(e instanceof Error?e.message:'Não foi possível enviar. Tente novamente.');}finally{setBusy(false);}}
 if(rider.isLoading)return <p>Carregando cadastro…</p>;
 if(!rider.data)return <p className="text-destructive">Cadastro não encontrado. Procure Carlos.</p>;
 const m=rider.data;
 return <div className="mx-auto max-w-lg space-y-6"><header className="flex items-center gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted"><UserRound className="h-7 w-7 text-primary"/></div><div className="min-w-0"><h2 className="text-xl font-semibold break-words">{m.name}</h2><p className="text-sm text-muted-foreground">Código {m.number??'—'}</p><p className={m.status==='active'?'text-sm text-success':'text-sm text-destructive'}>{m.status==='active'?'Ativo':'Inativo'} · {m.payment_status==='paid'?'Pago':'Pagamento pendente'}</p></div></header>
 <Tabs defaultValue="posto"><TabsList className="w-full"><TabsTrigger value="posto" className="flex-1">Posto</TabsTrigger><TabsTrigger value="history" className="flex-1">Meu consumo</TabsTrigger></TabsList><TabsContent value="posto" className="space-y-6 pt-4">
 <div className="rounded-lg border-2 border-primary bg-card px-4 py-5 text-center"><p className="text-sm text-muted-foreground">Placa da moto</p><p className="mt-2 text-4xl font-bold uppercase">{m.plate??'Não cadastrada'}</p></div>
 {confirmed&&<div role="status" className="flex items-center gap-2 text-success"><CheckCircle2 className="h-5 w-5"/>Abastecimento registrado e aprovado.</div>}
 {!price.data?<p className="text-warning">Aguardando o posto configurar o preço do litro.</p>:<p className="text-sm text-muted-foreground">Gasolina · {fuelMoney(Number(price.data.price))}/L</p>}
 <form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="fuel-amount">Valor abastecido (R$)</Label><Input id="fuel-amount" inputMode="decimal" placeholder="20,50" value={amount} disabled={busy||!!pendingId} onChange={e=>setAmount(e.target.value)} required className="h-12 text-lg"/></div><div className="space-y-2"><Label htmlFor="fuel-discount">Desconto (R$) · opcional</Label><Input id="fuel-discount" inputMode="decimal" placeholder="0,00" value={discount} disabled={busy||!!pendingId} onChange={e=>setDiscount(e.target.value)} className="h-12"/></div>
 <div className="space-y-2"><Label>Foto do comprovante</Label><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" disabled={busy||!!pendingId} onChange={e=>setFile(e.target.files?.[0]??null)}/><Button type="button" variant="outline" className="h-12 w-full" disabled={busy||!!pendingId} onClick={()=>fileInput.current?.click()}><Camera className="mr-2 h-5 w-5"/>{file?'Trocar foto':'Adicionar foto'}</Button>{file&&<p className="break-all text-sm text-muted-foreground">{file.name}</p>}</div>
 <div className="flex justify-between border-y py-4"><span>Litros estimados</span><strong>{Number.isFinite(liters)&&liters>0?liters.toLocaleString('pt-BR',{maximumFractionDigits:3}):'0'} L</strong></div><Button className="h-12 w-full" disabled={busy||!price.data||!file}>{busy?'Enviando…':pendingId?'Tentar envio novamente':'Confirmar abastecimento'}</Button></form>
 </TabsContent><TabsContent value="history" className="pt-4">{fillings.isError?<p className="text-destructive">Não foi possível carregar o consumo.</p>:<FuelRecords rows={fillings.data??[]}/>}</TabsContent></Tabs></div>;
}
