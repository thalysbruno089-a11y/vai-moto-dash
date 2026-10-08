import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useMotoboys } from '@/hooks/useMotoboys';

const { order } = vi.hoisted(() => ({ order: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ order }) }) },
}));

describe('payment status refresh', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

  it('reads a payment changed on another device while the list remains open', async () => {
    order.mockResolvedValueOnce({ data: [{ id: 'motoboy', payment_status: 'pending' }], error: null });
    order.mockResolvedValue({ data: [{ id: 'motoboy', payment_status: 'paid' }], error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result, unmount } = renderHook(() => useMotoboys(), {
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    });
    await waitFor(() => expect(result.current.data?.[0].payment_status).toBe('pending'));
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    await waitFor(() => expect(result.current.data?.[0].payment_status).toBe('paid'));
    unmount();
    client.clear();
  });
});