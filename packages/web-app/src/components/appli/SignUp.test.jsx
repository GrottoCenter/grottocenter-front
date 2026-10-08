import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import SignUp from './SignUp';

const { mutate, onError } = vi.hoisted(() => ({
  mutate: vi.fn(),
  onError: vi.fn()
}));

vi.mock('@/hooks', () => ({
  useSignUp: () => ({ mutate, isPending: false, isSuccess: false }),
  useNotification: () => ({ onError }),
  usePermissions: () => ({ isAuth: false })
}));
vi.mock('react-redux', () => ({
  useSelector: selector => selector({ intl: { locale: 'en' } })
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const fillForm = (extraCharacters = 0) => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <SignUp />
    </IntlProvider>
  );
  [
    ['Nickname', 'n'.repeat(68 + extraCharacters)],
    ['Name', 'f'.repeat(36 + extraCharacters)],
    ['Surname', 's'.repeat(32 + extraCharacters)],
    ['Email', 'test@example.org'],
    ['Password', 'ValidPassword123!'],
    ['Password confirmation', 'ValidPassword123!']
  ].forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(new RegExp(`^${label}\\s*\\*?$`)), {
      target: { value }
    });
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Sign up' }).closest('form')
  );
};

describe('SignUp API length validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('submits names and a nickname at the API limits', () => {
    fillForm();
    expect(onError).not.toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: 'n'.repeat(68),
        name: 'f'.repeat(36),
        surname: 's'.repeat(32)
      })
    );
  });

  it('blocks all oversized names and identifies each field', () => {
    fillForm(1);
    expect(mutate).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(3);
    expect(onError).toHaveBeenCalledWith(
      'Nickname: Maximum 68 characters (69 entered).'
    );
    expect(onError).toHaveBeenCalledWith(
      'Name: Maximum 36 characters (37 entered).'
    );
    expect(onError).toHaveBeenCalledWith(
      'Surname: Maximum 32 characters (33 entered).'
    );
  });
});
