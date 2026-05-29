import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastContainer } from './Toast';

const mockRemoveToast = vi.fn();
const mockToasts = vi.fn();

vi.mock('../../store/uiStore', () => ({
  useUiStore: () => ({ toasts: mockToasts(), removeToast: mockRemoveToast }),
}));

describe('ToastContainer', () => {
  beforeEach(() => {
    mockRemoveToast.mockClear();
  });

  it('renders nothing when there are no toasts', () => {
    mockToasts.mockReturnValue([]);
    const { container } = render(<ToastContainer />);
    expect(container.querySelector('.fixed')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders toast messages', () => {
    mockToasts.mockReturnValue([
      { id: '1', message: 'Success!', type: 'success' },
      { id: '2', message: 'Error!', type: 'error' },
    ]);
    render(<ToastContainer />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('applies correct style for success toast', () => {
    mockToasts.mockReturnValue([{ id: '1', message: 'Done', type: 'success' }]);
    render(<ToastContainer />);
    const toast = screen.getByText('Done').closest('div[class*="bg-"]');
    expect(toast?.className).toContain('bg-green-600');
  });

  it('applies correct style for error toast', () => {
    mockToasts.mockReturnValue([{ id: '1', message: 'Fail', type: 'error' }]);
    render(<ToastContainer />);
    const toast = screen.getByText('Fail').closest('div[class*="bg-"]');
    expect(toast?.className).toContain('bg-red-600');
  });

  it('applies correct style for info toast', () => {
    mockToasts.mockReturnValue([{ id: '1', message: 'Info', type: 'info' }]);
    render(<ToastContainer />);
    const toast = screen.getByText('Info').closest('div[class*="bg-"]');
    expect(toast?.className).toContain('bg-blue-600');
  });

  it('calls removeToast when close button is clicked', async () => {
    mockToasts.mockReturnValue([{ id: '42', message: 'Dismiss me', type: 'info' }]);
    render(<ToastContainer />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockRemoveToast).toHaveBeenCalledWith('42');
  });

  it('renders multiple toasts with individual close buttons', async () => {
    mockToasts.mockReturnValue([
      { id: '1', message: 'First', type: 'success' },
      { id: '2', message: 'Second', type: 'error' },
    ]);
    render(<ToastContainer />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    await userEvent.click(buttons[1]);
    expect(mockRemoveToast).toHaveBeenCalledWith('2');
  });
});
