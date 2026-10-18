import { describe,it,expect } from 'vitest';
import { moneyInput,fuelLiters,fillingSchema } from '../lib/fuel';
describe('abastecimento',()=>{
 it('aceita 20,50 e 20.50',()=>{expect(moneyInput('20,50')).toBe(20.5);expect(moneyInput('20.50')).toBe(20.5);expect(moneyInput('20abc')).toBeNaN();});
 it('calcula (valor-desconto)/preço',()=>{expect(fuelLiters(20.5,2.5,6)).toBe(3);});
 it('aceita desconto opcional zero',()=>{expect(fillingSchema.safeParse({amount:20.5,discount:0}).success).toBe(true);});
 it('rejeita desconto maior ou igual ao valor',()=>{expect(fillingSchema.safeParse({amount:20,discount:20}).success).toBe(false);expect(fillingSchema.safeParse({amount:20,discount:21}).success).toBe(false);});
});
