import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import FeaturedImageSelect from './FeaturedImageSelect';

const Selector = ({ files, featuredFile = null }) => {
  const { control } = useForm({
    defaultValues: { entrance: { featuredFile } }
  });
  return (
    <FeaturedImageSelect
      control={control}
      documents={[{ id: 1, title: 'Entrance photos', files }]}
    />
  );
};

it('explains the empty state and excludes unvalidated files and unsupported formats', () => {
  renderWithProviders(
    <Selector
      files={[
        { id: 1, fileName: 'pending.jpg', isValidated: false },
        { id: 2, fileName: 'survey.pdf' },
        { id: 3, fileName: 'drawing.svg' }
      ]}
    />,
    { messages }
  );
  expect(screen.getByText(messages['featuredImage.empty'])).toBeVisible();
  expect(screen.queryByTestId('featured-image-toggle')).toBeNull();
  expect(screen.queryByTestId('featured-image-options')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('radiogroup')).toBeNull();
  expect(screen.queryByRole('img')).toBeNull();
});

it('shows every image card and keeps keyboard selection open until explicitly closed', async () => {
  const files = Array.from({ length: 12 }, (_, id) => ({
    id: id + 1,
    fileName: `${id + 1}.bmp`,
    completePath: `/${id + 1}.bmp`
  }));
  renderWithProviders(<Selector files={files} featuredFile={12} />, {
    messages
  });
  const toggle = screen.getByTestId('featured-image-toggle');
  expect(screen.queryByRole('radiogroup')).toBeNull();
  expect(screen.queryByRole('button', { name: /^Preview / })).toBeNull();
  fireEvent.click(toggle);
  const selected = screen.getByRole('radio', { name: /Image 12 of 12/ });
  expect(selected).toBeChecked();
  expect(selected).toHaveFocus();
  expect(toggle).not.toBeVisible();
  expect(screen.getAllByRole('radio')).toHaveLength(13);
  selected.focus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(screen.getByRole('radio', { name: /Image 11 of 12/ })).toBeChecked();
  expect(screen.getByRole('radiogroup')).toBeVisible();
  expect(screen.queryByRole('img', { name: /Image 11 of 12/ })).toBeNull();
  expect(screen.queryByText('11.bmp')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: messages.Close }));
  expect(toggle).toBeVisible();
  expect(toggle).toHaveFocus();
  expect(
    screen.getByRole('img', { name: /Entrance photos — Image 11 of 12/ })
  ).toBeVisible();
  expect(screen.queryByRole('radiogroup')).toBeNull();
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

it.each([{ files: [] }, { files: [{ id: 2, fileName: 'other.jpg' }] }])(
  'preserves an unavailable saved selection until explicitly cleared (%j)',
  ({ files }) => {
    renderWithProviders(<Selector files={files} featuredFile={1} />, {
      messages
    });
    const toggle = screen.getByTestId('featured-image-toggle');
    expect(toggle).toHaveTextContent(messages['featuredImage.unavailable']);
    fireEvent.click(toggle);
    expect(
      screen.getByRole('radio', { name: 'No featured image' })
    ).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: messages.Close }));
    expect(toggle).toHaveTextContent(messages['featuredImage.unavailable']);
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('radio', { name: 'No featured image' }));
    if (files.length > 0) {
      expect(
        screen.getByRole('radio', { name: 'No featured image' })
      ).toBeChecked();
      fireEvent.click(screen.getByRole('button', { name: messages.Close }));
      expect(toggle).toHaveTextContent(messages['featuredImage.none']);
    } else {
      expect(screen.getByText(messages['featuredImage.empty'])).toBeVisible();
    }
  }
);
