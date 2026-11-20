import { List, Button } from '@mui/material';
import { action } from 'storybook/actions';
import Contribution from '@/components/common/Contribution/Contribution';
import SectionTitle from '../Entry/SectionTitle';
import ContributionItem from './ContributionItem';

const meta = {
  title: 'Contributions/ContributionItem',
  component: ContributionItem,
  decorators: [
    Story => (
      <List dense disablePadding>
        <Story />
      </List>
    )
  ],
  args: {
    title: <SectionTitle title="Example contribution" anchorId="example" />,
    actions: (
      <Button variant="outlined" size="small" onClick={action('edit')}>
        Edit
      </Button>
    ),
    children: (
      <Contribution
        body="A description or access text wraps around the actions, while history keeps its actions beside the text."
        author={{ id: 1, nickname: 'Example author' }}
        dateInscription="2026-11-20T10:00:00Z"
        language="eng"
      />
    )
  }
};
export default meta;

export const Titled = {};
export const History = { args: { title: null, inlineActions: true } };
export const Deleted = {
  args: {
    title: <SectionTitle title="Deleted contribution" isDeleted />,
    children: (
      <Contribution
        body="A deleted contribution retains its text and attribution."
        author={{ id: 1, nickname: 'Example author' }}
        dateInscription="2026-11-20T10:00:00Z"
        isDeleted
      />
    )
  }
};
