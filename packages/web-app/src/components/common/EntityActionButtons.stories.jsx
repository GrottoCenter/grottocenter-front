import EntityActionButtons from './EntityActionButtons';

export default {
  title: 'Common/EntityActionButtons',
  component: EntityActionButtons,
  args: {
    preview: { label: 'Preview Marie Dupont (#101)', onClick: () => {} },
    edit: {
      label: 'Edit Marie Dupont (#101) in a new tab',
      to: '/ui/persons/101/edit'
    },
    open: {
      label: 'Open Marie Dupont (#101) in a new tab',
      to: '/ui/persons/101'
    }
  }
};
export const AllActions = {};
export const ReadOnly = { args: { edit: null } };
export const Disabled = { args: { isDisabled: true } };
