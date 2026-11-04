import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { Box, Button } from '@mui/material';
import OrganizationBasicFields from './OrganizationBasicFields';
import { defaultOrganizationValues } from './formValues';

const Example = ({ type = '' }) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { organization: { ...defaultOrganizationValues, type } }
  });
  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(() => {})}
      sx={{ maxWidth: 560 }}>
      <OrganizationBasicFields control={control} errors={errors} />
      <Button type="submit" sx={{ mt: 2 }}>
        Validate
      </Button>
    </Box>
  );
};
Example.propTypes = { type: PropTypes.string };

const meta = {
  title: 'Forms/OrganizationBasicFields',
  component: OrganizationBasicFields,
  render: args => <Example type={args.type} />
};
export default meta;
export const Empty = {};
export const Publisher = { args: { type: 'EDITION' } };
