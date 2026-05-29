import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRouter(initialRoute: string, requireAdmin?: boolean) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/auth" element={<div data-testid="auth-page">Auth</div>} />
        <Route path="/documents" element={<div data-testid="documents-page">Documents</div>} />
        <Route element={<ProtectedRoute requireAdmin={requireAdmin} />}>
          <Route path="/protected" element={<div data-testid="protected-content">Protected</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  describe('unauthenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, isAdmin: false });
    });

    it('redirects to /auth', () => {
      renderWithRouter('/protected');
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('authenticated (non-admin)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, isAdmin: false });
    });

    it('renders child route', () => {
      renderWithRouter('/protected');
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('redirects to /documents when requireAdmin is true', () => {
      renderWithRouter('/protected', true);
      expect(screen.getByTestId('documents-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('admin', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, isAdmin: true });
    });

    it('renders child route', () => {
      renderWithRouter('/protected');
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('renders child route when requireAdmin is true', () => {
      renderWithRouter('/protected', true);
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
