import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseAuth = vi.fn();

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('./pages/AuthPage', () => ({
  AuthPage: () => <div data-testid="auth-page">AuthPage</div>,
}));

vi.mock('./pages/DocumentsPage', () => ({
  DocumentsPage: () => <div data-testid="documents-page">DocumentsPage</div>,
}));

vi.mock('./pages/SummaryPage', () => ({
  SummaryPage: () => <div data-testid="summary-page">SummaryPage</div>,
}));

vi.mock('./pages/FAQPage', () => ({
  FAQPage: () => <div data-testid="faq-page">FAQPage</div>,
}));

vi.mock('./pages/AdminPage', () => ({
  AdminPage: () => <div data-testid="admin-page">AdminPage</div>,
}));

vi.mock('./pages/AuthPage/PasswordReset/ResetPassword', () => ({
  ResetPassword: () => <div data-testid="reset-password">ResetPassword</div>,
}));

vi.mock('./store/uiStore', () => ({
  useUiStore: () => ({ toasts: [], removeToast: vi.fn() }),
}));

import App from './App';

describe('App - unauthenticated', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isAdmin: false });
  });

  it('renders without crashing', () => {
    render(<App />);
  });

  it('shows auth page at /auth', () => {
    window.history.pushState({}, '', '/auth');
    render(<App />);
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });

  it('redirects to /auth when accessing protected route', () => {
    window.history.pushState({}, '', '/documents');
    render(<App />);
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('documents-page')).not.toBeInTheDocument();
  });

  it('redirects to /auth when accessing admin route', () => {
    window.history.pushState({}, '', '/faq');
    render(<App />);
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('faq-page')).not.toBeInTheDocument();
  });

  it('redirects unknown routes to /documents (then to /auth)', () => {
    window.history.pushState({}, '', '/unknown');
    render(<App />);
    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
  });
});

describe('App - authenticated (non-admin)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isAdmin: false });
  });

  it('renders documents page', () => {
    window.history.pushState({}, '', '/documents');
    render(<App />);
    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
  });

  it('renders summary page', () => {
    window.history.pushState({}, '', '/summary');
    render(<App />);
    expect(screen.getByTestId('summary-page')).toBeInTheDocument();
  });

  it('redirects non-admin from admin route to /documents', () => {
    window.history.pushState({}, '', '/faq');
    render(<App />);
    expect(screen.getByTestId('documents-page')).toBeInTheDocument();
    expect(screen.queryByTestId('faq-page')).not.toBeInTheDocument();
  });
});

describe('App - admin', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isAdmin: true });
  });

  it('renders FAQ page', () => {
    window.history.pushState({}, '', '/faq');
    render(<App />);
    expect(screen.getByTestId('faq-page')).toBeInTheDocument();
  });

  it('renders admin page', () => {
    window.history.pushState({}, '', '/admin');
    render(<App />);
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
  });
});

describe('App - public routes', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isAdmin: false });
  });

  it('renders reset password page', () => {
    window.history.pushState({}, '', '/reset-password/test-token');
    render(<App />);
    expect(screen.getByTestId('reset-password')).toBeInTheDocument();
  });
});
