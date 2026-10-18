import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
const schema = z.object({ kind: z.enum(['fuel_rider','fuel_station']), motoboyId: z.string().uuid().optional(), username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/), password: z.string().min(8).max(128), userId: z.string().uuid().optional() });
Deno.serve(async(req)=>{
 const response=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
 if(req.method==='OPTIONS')return response({ok:true});
 if(req.method!=='POST')return response({error:'Método inválido'},405);
 try{
 const db=createClient(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'');
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
 if(!token)return response({error:'Acesso negado'},401);
 const {data:{user},error:authError}=await db.auth.getUser(token);
 if(authError||!user)return response({error:'Acesso negado'},401);
 const {data:profile}=await db.from('profiles').select('role,company_id').eq('id',user.id).single();
 if(profile?.role!=='admin'||!profile.company_id)return response({error:'Somente Carlos pode gerenciar acessos'},403);
 const input=schema.safeParse(await req.json());
 if(!input.success)return response({error:'Use login com 3 a 40 caracteres e senha com pelo menos 8 caracteres'},400);
 const b=input.data;
 if(b.userId){
 const {data:a}=await db.from('fuel_accounts').select('user_id,username').eq('user_id',b.userId).eq('company_id',profile.company_id).single();
 if(!a||a.username!==b.username)return response({error:'Acesso não encontrado'},404);
 const {error}=await db.auth.admin.updateUserById(a.user_id,{password:b.password});if(error)throw error;
 return response({ok:true});
 }
 let motoboyId:null|string=null;
 if(b.kind==='fuel_rider'){
 const {data:m}=await db.from('motoboys').select('id').eq('id',b.motoboyId??'').eq('company_id',profile.company_id).single();
 if(!m)return response({error:'Selecione um motoboy cadastrado'},400);motoboyId=m.id;
 }
 const {data:existing}=await db.from('fuel_accounts').select('user_id').or(`username.eq.${b.username}${motoboyId?`,motoboy_id.eq.${motoboyId}`:''}`).limit(1);
 if(existing?.length)return response({error:'Login ou motoboy já possui acesso'},409);
 const {data:created,error}=await db.auth.admin.createUser({email:`${b.username}@posto.vaimoto.app`,password:b.password,email_confirm:true});
 if(error||!created.user)return response({error:'Não foi possível criar o acesso. Verifique o login e a senha.'},400);
 const id=created.user.id;
 const {error:accountError}=await db.from('fuel_accounts').insert({user_id:id,company_id:profile.company_id,motoboy_id:motoboyId,username:b.username});
 const {error:roleError}=accountError?{error:accountError}:await db.from('user_roles').insert({user_id:id,role:b.kind});
 if(roleError){await db.from('fuel_accounts').delete().eq('user_id',id);await db.auth.admin.deleteUser(id);throw roleError;}
 return response({ok:true});
 }catch{return response({error:'Não foi possível salvar o acesso'},400);}
});
