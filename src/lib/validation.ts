import { z } from 'zod';

// CPF validation helper - validates format and checksum
const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
};

// Brazilian phone validation - accepts formats like (11) 99999-9999 or 11999999999
const validateBrazilianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  // Valid: 10 digits (landline) or 11 digits (mobile with 9)
  return cleaned.length === 10 || cleaned.length === 11;
};

// Date format validation (YYYY-MM-DD)
const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

// CPF Schema - optional but validated if provided
export const cpfSchema = z.string()
  .optional()
  .nullable()
  .refine(
    (val) => !val || validateCPF(val),
    { message: 'CPF inválido. Deve conter 11 dígitos válidos.' }
  );

// Phone Schema - optional but validated if provided  
export const phoneSchema = z.string()
  .optional()
  .nullable()
  .refine(
    (val) => !val || validateBrazilianPhone(val),
    { message: 'Telefone inválido. Use formato brasileiro (10-11 dígitos).' }
  );

// Financial value schema - positive number with reasonable limits
export const financialValueSchema = z.number()
  .positive({ message: 'O valor deve ser maior que zero.' })
  .max(10000000, { message: 'O valor não pode exceder R$ 10.000.000,00.' });

// Optional financial value (allows 0 or null)
export const optionalFinancialValueSchema = z.number()
  .min(0, { message: 'O valor não pode ser negativo.' })
  .max(10000000, { message: 'O valor não pode exceder R$ 10.000.000,00.' })
  .optional()
  .nullable();

// Date schema (YYYY-MM-DD format)
export const dateSchema = z.string()
  .regex(dateFormatRegex, { message: 'Data inválida. Use o formato AAAA-MM-DD.' });

// Date range validation
export const dateRangeSchema = z.object({
  period_start: dateSchema,
  period_end: dateSchema,
}).refine(
  (data) => new Date(data.period_start) <= new Date(data.period_end),
  { message: 'A data de início deve ser anterior ou igual à data de fim.' }
);

// Motoboy validation schema
export const motoboySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  number: z.string().max(20, 'Número muito longo').optional().nullable(),
  phone: phoneSchema,
  cpf: cpfSchema,
  address: z.string().max(500, 'Endereço muito longo').optional().nullable(),
  shift: z.enum(['day', 'night', 'weekend', 'star', 'free']),
  status: z.enum(['active', 'inactive']),
  weekly_payment: optionalFinancialValueSchema,
});

// Cash flow validation schema
export const cashFlowSchema = z.object({
  type: z.enum(['revenue', 'expense']),
  value: financialValueSchema,
  description: z.string().max(500, 'Descrição muito longa').optional().nullable(),
  flow_date: dateSchema,
  category_id: z.string().uuid().optional().nullable(),
  is_recurring: z.boolean(),
});

// Payment validation schema
export const paymentSchema = z.object({
  motoboy_id: z.string().uuid().optional().nullable(),
  value: z.number().min(0, 'O valor não pode ser negativo').max(10000000),
  period_start: dateSchema,
  period_end: dateSchema,
  status: z.enum(['paid', 'pending']).optional(),
}).refine(
  (data) => new Date(data.period_start) <= new Date(data.period_end),
  { message: 'A data de início deve ser anterior ou igual à data de fim.' }
);

// Category validation schema
export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  type: z.enum(['revenue', 'expense']),
});

// Helper to validate and return parsed data or throw
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Helper to safely validate and return result with errors
export function safeValidateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: string[] 
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    errors: result.error.errors.map(e => e.message) 
  };
}
