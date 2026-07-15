import React from 'react';
import { vi } from 'vitest';

const mockNavigate = vi.fn();

export const useNavigate = () => mockNavigate;
export const useLocation = () => ({ pathname: '/', search: '', hash: '' });
export const useParams = () => ({});
export const MemoryRouter = ({ children }) => children;
export const Link = ({ children, to }) =>
  React.createElement('a', { href: to }, children);
