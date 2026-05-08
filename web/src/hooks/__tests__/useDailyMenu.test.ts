import { act, renderHook, waitFor } from '@testing-library/react';

import { useDailyMenu } from '../useDailyMenu';

describe('useDailyMenu', () => {
  it('starts empty and not loading', () => {
    const { result } = renderHook(() => useDailyMenu());

    expect(result.current.currentMenu).toBeNull();
    expect(result.current.selectedDateMenus).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isEmpty).toBe(true);
  });

  it('loads the daily menu for a school and date', async () => {
    const { result } = renderHook(() => useDailyMenu());

    await act(async () => {
      await result.current.loadDailyMenu('school-1', '2026-05-07');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentMenu?.date).toBe('2026-05-07');
    expect(result.current.selectedDateMenus).toHaveLength(2);
    expect(result.current.hasMenuForSelectedDate).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('changes selected date and refreshes the current menu', async () => {
    const { result } = renderHook(() => useDailyMenu());

    act(() => {
      result.current.selectDate('2026-05-08');
    });

    await act(async () => {
      await result.current.refreshMenu('school-1');
    });

    expect(result.current.selectedDate).toBe('2026-05-08');
    expect(result.current.currentMenu?.date).toBe('2026-05-08');
  });

  it('dismisses an existing error state without changing menu data', async () => {
    const { result } = renderHook(() => useDailyMenu());

    await act(async () => {
      await result.current.loadDailyMenu('school-1', '2026-05-07');
    });
    act(() => {
      result.current.dismissError();
    });

    expect(result.current.hasError).toBe(false);
    expect(result.current.currentMenu).not.toBeNull();
  });
});
