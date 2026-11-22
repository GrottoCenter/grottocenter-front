import { fireEvent, screen, within } from '@testing-library/react';
import useMediaQuery from '@mui/material/useMediaQuery';
import ResponsiveActions from '@/components/common/Layouts/ResponsiveActions';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { useSubscriptionAction } from './useSubscriptionAction';

vi.mock('@mui/material/useMediaQuery', () => ({ default: vi.fn() }));

const SubscriptionActions = ({
  isSubscribed = false,
  isLoading = false,
  canSubscribe = true,
  onClick
}) => {
  const subscriptionAction = useSubscriptionAction({
    isSubscribed,
    isLoading,
    canSubscribe,
    onClick
  });
  return (
    <ResponsiveActions
      items={[subscriptionAction, { key: 'share', label: 'Copy link' }]}
    />
  );
};

it.each([
  [true, false],
  [true, true],
  [false, false],
  [false, true]
])(
  'preserves subscription state, pending icon and callbacks (desktop: %s, subscribed: %s)',
  (isDesktop, isSubscribed) => {
    useMediaQuery.mockReturnValue(isDesktop);
    const onClick = vi.fn();
    const { rerender } = renderWithProviders(
      <SubscriptionActions isSubscribed={isSubscribed} onClick={onClick} />,
      { messages }
    );
    if (!isDesktop)
      fireEvent.click(screen.getByRole('button', { name: 'actions' }));
    const role = isDesktop ? 'button' : 'menuitem';
    const label = isSubscribed ? 'Unsubscribe' : 'Subscribe';
    const action = screen.getByRole(role, { name: label });
    expect(
      within(action).getByTestId(
        isSubscribed ? 'NotificationsActiveIcon' : 'NotificationsNoneIcon'
      )
    ).toBeVisible();
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <SubscriptionActions
        isSubscribed={isSubscribed}
        isLoading
        onClick={onClick}
      />
    );
    if (!isDesktop)
      fireEvent.click(screen.getByRole('button', { name: 'actions' }));
    expect(
      within(screen.getByRole(role, { name: label })).getByRole('progressbar')
    ).toBeVisible();

    rerender(
      <SubscriptionActions isSubscribed={!isSubscribed} onClick={onClick} />
    );
    expect(
      within(
        screen.getByRole(role, {
          name: isSubscribed ? 'Subscribe' : 'Unsubscribe'
        })
      ).queryByRole('progressbar')
    ).toBeNull();
  }
);

it.each([true, false])(
  'keeps a forbidden subscription out of the responsive actions (desktop: %s)',
  isDesktop => {
    useMediaQuery.mockReturnValue(isDesktop);
    renderWithProviders(<SubscriptionActions canSubscribe={false} />, {
      messages
    });
    expect(screen.queryByTestId('action-subscribe')).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'actions' })).toBeNull();
  }
);
