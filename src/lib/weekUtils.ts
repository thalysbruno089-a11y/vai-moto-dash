import { format, addDays, startOfMonth, endOfMonth, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PaymentWeek {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  month: string;
  year: number;
}

/**
 * Gera as semanas de pagamento de um mês (quinta a quarta)
 * Semana 1: Primeira quinta do mês até quarta seguinte
 */
export function getPaymentWeeksForMonth(date: Date): PaymentWeek[] {
  const weeks: PaymentWeek[] = [];
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const monthName = format(date, 'MMMM', { locale: ptBR });
  const year = date.getFullYear();
  
  // Encontrar a primeira quinta-feira do mês ou antes
  let currentThursday = monthStart;
  const dayOfWeek = getDay(monthStart);
  
  // Se não é quinta (4), ajustar para a quinta anterior ou próxima
  if (dayOfWeek !== 4) {
    // Calcular dias até a próxima quinta
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    // Se a próxima quinta está muito longe, começar da quinta anterior
    if (daysUntilThursday > 0 && daysUntilThursday <= 3) {
      currentThursday = addDays(monthStart, daysUntilThursday);
    } else {
      // Voltar para a quinta anterior
      const daysFromThursday = (dayOfWeek - 4 + 7) % 7;
      currentThursday = addDays(monthStart, -daysFromThursday);
    }
  }
  
  let weekNumber = 1;
  
  while (currentThursday <= monthEnd || weekNumber === 1) {
    const weekEnd = addDays(currentThursday, 6); // Quarta-feira seguinte
    
    // Só adicionar se a semana tem dias no mês atual
    if (currentThursday <= monthEnd) {
      weeks.push({
        id: `${year}-${date.getMonth() + 1}-W${weekNumber}`,
        label: `Semana ${weekNumber} (${format(currentThursday, 'dd/MM')} - ${format(weekEnd, 'dd/MM')})`,
        startDate: currentThursday,
        endDate: weekEnd,
        month: monthName,
        year,
      });
      weekNumber++;
    }
    
    currentThursday = addDays(currentThursday, 7);
    
    // Limitar a 5 semanas para evitar loop infinito
    if (weekNumber > 5) break;
  }
  
  return weeks;
}

/**
 * Gera as semanas para os próximos N meses
 */
export function getPaymentWeeksForMonths(months: number = 3): { month: string; year: number; weeks: PaymentWeek[] }[] {
  const result: { month: string; year: number; weeks: PaymentWeek[] }[] = [];
  const today = new Date();
  
  // Mês anterior, atual e próximo
  for (let i = -1; i < months; i++) {
    const date = addMonths(today, i);
    const weeks = getPaymentWeeksForMonth(date);
    if (weeks.length > 0) {
      result.push({
        month: format(date, 'MMMM yyyy', { locale: ptBR }),
        year: date.getFullYear(),
        weeks,
      });
    }
  }
  
  return result;
}

/**
 * Formata datas de período para exibição
 */
export function formatWeekPeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`;
}
