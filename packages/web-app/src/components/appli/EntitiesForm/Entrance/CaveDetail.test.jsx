import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useForm } from 'react-hook-form';

import CaveDetail from './CaveDetail';

const messages = {
  Characteristics: 'Characteristics',
  Depth: 'Depth',
  Development: 'Development',
  Temperature: 'Temperature',
  'Year of discovery': 'Year of discovery',
  'Diving cave': 'Diving cave',
  'Touristic site': 'Touristic site'
};

const CaveDetailHarness = ({ showEntranceFields = true }) => {
  const { control } = useForm({
    defaultValues: { cave: {}, entrance: {} }
  });

  return (
    <IntlProvider locale="en" messages={messages}>
      <CaveDetail
        control={control}
        errors={{}}
        showEntranceFields={showEntranceFields}
      />
    </IntlProvider>
  );
};

describe('CaveDetail', () => {
  it('shows entrance-specific fields in an entrance form', () => {
    render(<CaveDetailHarness />);

    expect(screen.getByLabelText('Year of discovery')).toBeInTheDocument();
    expect(screen.getByText('Touristic site')).toBeInTheDocument();
  });

  it('only shows cave fields in a network form', () => {
    render(<CaveDetailHarness showEntranceFields={false} />);

    expect(screen.getByLabelText('Depth')).toBeInTheDocument();
    expect(screen.getByText('Diving cave')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Year of discovery')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Touristic site')).not.toBeInTheDocument();
  });
});
