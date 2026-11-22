import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Button, Typography } from '@mui/material';
import { action } from 'storybook/actions';
import Alert from '@/components/common/Alert';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import ContributionSection from './ContributionSection';
import ContributionItem from './ContributionItem';

const items = [
  { id: 2, relevance: 2, body: 'The second contribution.' },
  { id: 1, relevance: 1, body: 'The first contribution.' }
];

const Example = ({ isEmpty = false }) => {
  const { formatMessage } = useIntl();
  const [isFormVisible, setIsFormVisible] = useState(false);
  return (
    <ContributionSection
      title={formatMessage({ id: 'Description' })}
      anchorId="description"
      items={isEmpty ? [] : items}
      createAction={
        <SectionCreateButton
          isOpen={isFormVisible}
          onToggle={() => setIsFormVisible(visible => !visible)}
          label={formatMessage({ id: 'New' })}
          tooltip={formatMessage({ id: 'Add a new description' })}
          openTooltip={formatMessage({ id: 'Cancel adding a new description' })}
        />
      }
      form={isFormVisible ? <Typography>Form slot</Typography> : null}
      renderItem={item => (
        <ContributionItem
          actions={
            <Button size="small" onClick={action('edit')}>
              Edit
            </Button>
          }>
          <Typography component="span">{item.body}</Typography>
        </ContributionItem>
      )}
      emptyState={
        <Alert
          severity="info"
          content={formatMessage({ id: 'descriptions.none.entrance' })}
        />
      }
    />
  );
};
Example.propTypes = { isEmpty: PropTypes.bool };

const meta = {
  title: 'Contributions/ContributionSection',
  component: ContributionSection,
  render: ({ isEmpty }) => <Example isEmpty={isEmpty} />
};
export default meta;

export const Populated = {};
export const Empty = { args: { isEmpty: true } };
