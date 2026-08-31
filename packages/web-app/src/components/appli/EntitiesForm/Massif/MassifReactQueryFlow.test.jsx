import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MassifForm } from './index';

const mocks = vi.hoisted(() => {
  const mutation = data => ({
    data,
    error: null,
    isPending: false,
    mutateAsync: vi.fn()
  });
  return {
    createMassif: mutation({ id: 99 }),
    markMassif: mutation(null),
    notification: {
      onError: vi.fn(),
      onSuccess: vi.fn(),
      onWarning: vi.fn()
    },
    previewMassif: vi.fn(),
    setMassifLock: mutation(null),
    unmarkMassif: mutation(null),
    updateMassif: mutation({ id: 42 }),
    updateName: mutation(null)
  };
});

vi.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: ({ id }) => id })
}));

vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({ intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 1 } } } })
}));

vi.mock('@/hooks', () => ({
  useCreateMassif: () => mocks.createMassif,
  useMarkMassifSensitive: () => mocks.markMassif,
  useNotification: () => mocks.notification,
  usePermissions: () => ({ isAdmin: true }),
  usePreviewSensitiveMassif: () => mocks.previewMassif,
  useSetMassifSensitiveLock: () => mocks.setMassifLock,
  useUnmarkMassifSensitive: () => mocks.unmarkMassif,
  useUpdateMassif: () => mocks.updateMassif,
  useUpdateName: () => mocks.updateName
}));

vi.mock('../utils/FormContainers', () => ({
  FormContainer: ({ children }) => <div>{children}</div>,
  FormActionRow: ({ isSubmitting }) => (
    <button type="submit" disabled={isSubmitting}>
      Update
    </button>
  )
}));

vi.mock('../utils/LicenseBox', () => ({ default: () => null }));

vi.mock('../utils/FormProgressInfo', () => ({
  default: () => <div>submission complete</div>
}));

vi.mock('../../../common/Alert', () => ({
  default: ({ content }) => <div>{content}</div>
}));

vi.mock('../../../common/StandardDialog', () => ({
  default: ({ open, title, actions, children }) =>
    open ? (
      <div>
        <div>{title}</div>
        {children}
        {actions}
      </div>
    ) : null
}));

vi.mock('./MassifFields', async () => {
  const { Controller } = await import('react-hook-form');
  return {
    default: ({ control }) => (
      <Controller
        name="massif.geogPolygon"
        control={control}
        render={({ field }) => (
          <button
            type="button"
            onClick={() =>
              field.onChange({
                type: 'Polygon',
                coordinates: [
                  [
                    [0, 0],
                    [2, 0],
                    [2, 2],
                    [0, 0]
                  ]
                ]
              })
            }>
            change polygon
          </button>
        )}
      />
    )
  };
});

vi.mock('./MassifSensitivityControl', () => ({
  default: ({ onSensitiveChange, onLockChange }) => (
    <>
      <button type="button" onClick={() => onSensitiveChange(true)}>
        enable sensitivity
      </button>
      <button type="button" onClick={() => onLockChange(true)}>
        lock sensitivity
      </button>
    </>
  )
}));

const initialPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0]
    ]
  ]
};

const massif = {
  id: 42,
  name: 'Existing massif',
  names: [{ id: 7, name: 'Existing massif' }],
  language: 'eng',
  geogPolygon: JSON.stringify(initialPolygon),
  isSensitive: false,
  isSensitiveLocked: false
};

const openConfirmation = async user => {
  await user.click(screen.getByRole('button', { name: 'enable sensitivity' }));
  await user.click(screen.getByRole('button', { name: 'Update' }));
  return screen.findByRole('button', { name: 'Confirm' });
};

describe('MassifForm React Query flow', () => {
  beforeEach(() => {
    Object.values(mocks).forEach(value => {
      if (value?.mutateAsync) value.mutateAsync.mockReset();
    });
    Object.values(mocks.notification).forEach(mock => mock.mockReset());
    mocks.previewMassif.mockReset();
    mocks.createMassif.mutateAsync.mockResolvedValue({ id: 99 });
    mocks.markMassif.mutateAsync.mockResolvedValue({
      count: 2,
      skippedLockedCount: 0
    });
    mocks.previewMassif.mockResolvedValue({ count: 2, lockedCount: 0 });
    mocks.setMassifLock.mutateAsync.mockResolvedValue({});
    mocks.unmarkMassif.mutateAsync.mockResolvedValue({});
    mocks.updateMassif.mutateAsync.mockResolvedValue({ id: 42 });
    mocks.updateName.mutateAsync.mockResolvedValue({});
  });

  it('does not show a successful submission when the cascade fails', async () => {
    const user = userEvent.setup();
    mocks.markMassif.mutateAsync.mockRejectedValue(
      Object.assign(new Error('cascade failed'), { status: 500 })
    );
    render(<MassifForm massifValues={massif} />);

    await user.click(await openConfirmation(user));

    await waitFor(() => {
      expect(mocks.notification.onError).toHaveBeenCalledWith('cascade failed');
    });
    expect(screen.queryByText('submission complete')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('does not preview counts from the persisted polygon after a local edit', async () => {
    const user = userEvent.setup();
    render(<MassifForm massifValues={massif} />);

    await user.click(screen.getByRole('button', { name: 'change polygon' }));
    await openConfirmation(user);

    expect(mocks.previewMassif).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Entrances within the massif polygon will be marked as sensitive. This designation must be based on applicable legislation. Do you want to continue?'
      )
    ).toBeInTheDocument();
  });

  it('shows completion only after every mutation succeeds', async () => {
    const user = userEvent.setup();
    render(<MassifForm massifValues={massif} />);

    await user.click(await openConfirmation(user));

    expect(await screen.findByText('submission complete')).toBeInTheDocument();
    expect(mocks.updateMassif.mutateAsync).toHaveBeenCalledBefore(
      mocks.markMassif.mutateAsync
    );
  });

  it('locks a new massif after creating it', async () => {
    const user = userEvent.setup();
    render(<MassifForm />);

    await user.click(screen.getByRole('button', { name: 'lock sensitivity' }));
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('submission complete')).toBeInTheDocument();
    expect(mocks.createMassif.mutateAsync).toHaveBeenCalled();
    expect(mocks.setMassifLock.mutateAsync).toHaveBeenCalledWith({
      id: 99,
      isSensitiveLocked: true
    });
    expect(mocks.createMassif.mutateAsync).toHaveBeenCalledBefore(
      mocks.setMassifLock.mutateAsync
    );
  });
});
