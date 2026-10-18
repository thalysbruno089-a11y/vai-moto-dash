import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
export default function FuelLogin(){const [username,setUsername]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const navigate=useNavigate();
 async function login(e:React.FormEvent){e.preventDefault();const clean=username.trim().toLowerCase();if(!/^[a-z0-9._-]{3,40}$/.test(clean)){toast.error('Confira seu login');return;}setBusy(true);const {error}=await supabase.auth.signInWithPassword({email:`${clean}@posto.vaimoto.app`,password});setBusy(false);if(error)toast.error('Login ou senha incorretos');else navigate('/posto');}
 return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="w-full max-w-sm"><img src={logo} alt="Vai Moto" className="mx-auto mb-8 h-20 w-52 object-contain"/><h1 className="mb-2 text-center text-3xl font-semibold">Posto de Gasolina</h1><p className="mb-8 text-center text-muted-foreground">Motoboy e administrador do posto</p><form onSubmit={login} className="space-y-5"><div className="space-y-2"><Label htmlFor="station-user">Login</Label><Input id="station-user" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required className="h-12"/></div><div className="space-y-2"><Label htmlFor="station-password">Senha</Label><Input id="station-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required className="h-12"/></div><Button className="h-12 w-full" disabled={busy}>{busy?'Entrando…':'Entrar'}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">Esqueceu sua senha? Procure Carlos.</p></div></main>;
}
