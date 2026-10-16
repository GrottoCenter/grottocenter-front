import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { Button, Stack } from '@mui/material';
import OrganizationTypeField from './OrganizationTypeField';

const Example = ({ type = '', disabled = false }) => {
  const { control, handleSubmit } = useForm({
    mode: 'onTouched',
    defaultValues: { type }
  });
  return (
    <Stack
      component="form"
      noValidate
      spacing={2}
      onSubmit={handleSubmit(() => {})}>
      <OrganizationTypeField
        control={control}
        name="type"
        disabled={disabled}
      />
      <Button type="submit">Validate</Button>
    </Stack>
  );
};
Example.propTypes = { type: PropTypes.string, disabled: PropTypes.bool };

const meta = {
  title: 'Common/OrganizationTypeField',
  component: OrganizationTypeField,
  render: args => <Example type={args.type} disabled={args.disabled} />
};
export default meta;
export const Empty = {};
export const Classified = { args: { type: 'RESEARCH' } };
export const Unknown = { args: { type: 'FUTURE_TYPE' } };
export const Disabled = { args: { type: 'CAVE_RESCUE', disabled: true } };
