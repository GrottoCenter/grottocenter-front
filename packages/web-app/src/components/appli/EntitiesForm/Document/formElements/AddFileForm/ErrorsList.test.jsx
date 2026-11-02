import { render, screen } from '@testing-library/react';
import ErrorsList from './ErrorsList';

it('shows repeated errors only once while preserving distinct messages', () => {
  render(
    <ErrorsList
      errors={[
        'The file type is not accepted: scan.stl.',
        'The file type is not accepted: scan.stl.',
        'The file type is not accepted: clip.mp4.'
      ]}
    />
  );

  expect(
    screen.getAllByText('The file type is not accepted: scan.stl.')
  ).toHaveLength(1);
  expect(
    screen.getByText('The file type is not accepted: clip.mp4.')
  ).toBeInTheDocument();
});
