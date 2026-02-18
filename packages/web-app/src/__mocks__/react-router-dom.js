const mockNavigate = jest.fn();

module.exports = {
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '', hash: '' }),
  useParams: () => ({}),
  MemoryRouter: ({ children }) => children,
  Link: ({ children, to }) => {
    const React = require('react');
    return React.createElement('a', { href: to }, children);
  }
};
