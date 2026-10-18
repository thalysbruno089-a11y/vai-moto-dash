import { z } from 'zod';
export function moneyInput(value: string) { const normalized=value.trim().replace(',', '.'); return /^\d+(\.\d{1,3})?$/.test(normalized)?Number(normalized):NaN; }
export const fillingSchema=z.object({amount:z.number().finite().positive().max(100000),discount:z.number().finite().min(0)}).refine(v=>v.discount<v.amount,{message:'O desconto deve ser menor que o valor abastecido'});
export function fuelLiters(amount:number,discount:number,price:number){return price>0?(amount-discount)/price:0;}
export const fuelMoney=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
