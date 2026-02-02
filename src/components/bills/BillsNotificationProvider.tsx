import { useEffect, useState } from 'react';
import { useTodayBills } from '@/hooks/useBills';
import { BillsDueTodayDialog } from './BillsDueTodayDialog';

interface BillsNotificationProviderProps {
  children: React.ReactNode;
}

export function BillsNotificationProvider({ children }: BillsNotificationProviderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasShownToday, setHasShownToday] = useState(false);
  
  const { data: todayBills, isLoading } = useTodayBills();

  useEffect(() => {
    // Check if we've already shown the dialog today
    const today = new Date().toISOString().split('T')[0];
    const lastShown = localStorage.getItem('bills_notification_last_shown');
    
    if (lastShown === today) {
      setHasShownToday(true);
      return;
    }

    // Show dialog if there are bills due today and we haven't shown it yet
    if (!isLoading && todayBills && todayBills.length > 0 && !hasShownToday) {
      setDialogOpen(true);
      setHasShownToday(true);
      localStorage.setItem('bills_notification_last_shown', today);
    }
  }, [todayBills, isLoading, hasShownToday]);

  return (
    <>
      {children}
      <BillsDueTodayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bills={todayBills || []}
      />
    </>
  );
}
