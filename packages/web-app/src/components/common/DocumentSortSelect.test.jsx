import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';
import DocumentSortSelect from './DocumentSortSelect';

const viewport = vi.hoisted(() => ({ isDesktop: true }));
vi.mock('@/hooks/useIsDesktopLayout', () => ({
  useIsDesktopLayout: () => viewport.isDesktop
}));

const SortForm = () => {
  const [value, setValue] = useState(DOCUMENT_SORT_ORDERS.TITLE);
  return <DocumentSortSelect value={value} onChange={setValue} />;
};

it.each([true, false])(
  'keeps the complete selected sort accessible (desktop: %s)',
  async isDesktop => {
    viewport.isDesktop = isDesktop;
    const onParentClick = vi.fn();
    render(
      <IntlProvider locale="en" messages={messages}>
        <div role="presentation" onClick={onParentClick}>
          <SortForm />
        </div>
      </IntlProvider>
    );
    const control = screen.getByRole('combobox', { name: 'Sort by' });
    expect(control).toHaveAccessibleDescription('Title');
    expect(control.textContent.trim()).toBe(isDesktop ? 'Title' : '');
    const user = userEvent.setup();
    await user.hover(control);
    if (!isDesktop)
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Title');
    else expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.keyDown(control, { key: 'ArrowDown' });
    await waitFor(() =>
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    );
    expect(
      await screen.findByRole('option', { name: 'Title' })
    ).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('option', { name: 'Document type' }));
    expect(control).toHaveAccessibleDescription('Document type');
    expect(onParentClick).not.toHaveBeenCalled();
  }
);
