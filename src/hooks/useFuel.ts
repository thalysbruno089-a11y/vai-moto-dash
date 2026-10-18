import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
export function useFuelAccess(){
 const {user}=useAuth();
 return useQuery({queryKey:['fuel-access',user?.id],enabled:!!user,queryFn:async()=>{
 const {data,error}=await supabase.from('fuel_accounts').select('*').eq('user_id',user?.id??'').maybeSingle();if(error)throw error;return data;
 }});
}
export function useFuelData(companyId?:string){
 const price=useQuery({queryKey:['fuel-price',companyId],enabled:!!companyId,refetchInterval:10000,queryFn:async()=>{const {data,error}=await supabase.from('fuel_prices').select('*').eq('company_id',companyId??'').maybeSingle();if(error)throw error;return data;}});
 const fillings=useQuery({queryKey:['fuel-fillings',companyId],enabled:!!companyId,refetchInterval:10000,queryFn:async()=>{
 let rows:import('@/integrations/supabase/types').Tables<'fuel_fillings'>[]=[];
 for(let offset=0;;offset+=500){const {data,error}=await supabase.from('fuel_fillings').select('*').eq('company_id',companyId??'').order('created_at',{ascending:false}).order('id').range(offset,offset+499);if(error)throw error;rows=rows.concat(data);if(data.length<500)break;}return rows;
 }});
 return {price,fillings};
}
