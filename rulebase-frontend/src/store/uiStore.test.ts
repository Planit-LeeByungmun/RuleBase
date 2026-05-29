import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUiStore } from './uiStore';

beforeEach(() => {
  useUiStore.setState({ toasts: [] });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('uiStore', () => {
  describe('addToast', () => {
    it('adds a toast with default type "info"', () => {
      useUiStore.getState().addToast('Hello');
      const toasts = useUiStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Hello');
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].id).toBeTruthy();
    });

    it('adds a toast with specified type', () => {
      useUiStore.getState().addToast('Error!', 'error');
      expect(useUiStore.getState().toasts[0].type).toBe('error');
    });

    it('adds multiple toasts', () => {
      useUiStore.getState().addToast('First');
      useUiStore.getState().addToast('Second', 'success');
      expect(useUiStore.getState().toasts).toHaveLength(2);
    });

    it('auto-removes toast after 4 seconds', () => {
      useUiStore.getState().addToast('Temporary');
      expect(useUiStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(3999);
      expect(useUiStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(1);
      expect(useUiStore.getState().toasts).toHaveLength(0);
    });

    it('auto-removes only the specific toast after 4 seconds', () => {
      useUiStore.getState().addToast('First');
      vi.advanceTimersByTime(2000);
      useUiStore.getState().addToast('Second');

      vi.advanceTimersByTime(2000);
      const toasts = useUiStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Second');
    });
  });

  describe('removeToast', () => {
    it('removes a toast by id', () => {
      useUiStore.getState().addToast('To remove');
      const id = useUiStore.getState().toasts[0].id;
      useUiStore.getState().removeToast(id);
      expect(useUiStore.getState().toasts).toHaveLength(0);
    });

    it('does nothing for non-existent id', () => {
      useUiStore.getState().addToast('Keep');
      useUiStore.getState().removeToast('non-existent');
      expect(useUiStore.getState().toasts).toHaveLength(1);
    });
  });
});
