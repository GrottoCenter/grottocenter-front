import DuplicateComparisonPanel, {
  ComparisonField
} from './DuplicateComparisonPanel';
import EntityActionButtons from './EntityActionButtons';

export default {
  title: 'Common/DuplicateComparisonPanel',
  component: DuplicateComparisonPanel,
  args: {
    title: 'Marie Dupont (#101)',
    headerActions: (
      <EntityActionButtons
        preview={{ label: 'Preview Marie Dupont (#101)', onClick: () => {} }}
        open={{ label: 'Open profile in a new tab', to: '/ui/persons/101' }}
      />
    ),
    onKeep: () => {},
    children: (
      <>
        <ComparisonField label="First name">Marie</ComparisonField>
        <ComparisonField label="Last name">Dupont</ComparisonField>
        <ComparisonField label="Documents" isDifferent>
          {25}
        </ComparisonField>
      </>
    )
  }
};
export const Unselected = {};
export const Kept = { args: { isKept: true } };
export const Loading = { args: { isPending: true, children: null } };
export const Error = { args: { error: { status: 500 }, onRetry: () => {} } };
