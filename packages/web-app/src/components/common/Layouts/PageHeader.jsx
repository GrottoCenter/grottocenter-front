import PropTypes from 'prop-types';
import { Card } from '@mui/material';

import PageTitle from './PageTitle';

// mb only: horizontal + top gutter come from PageContainer's frame; this just
// adds the 8px gap before the next block (tabs bar or first section).
const PageHeader = props => (
  <Card sx={{ mb: 1, p: { xs: 1, md: 2 } }}>
    <PageTitle {...props} />
  </Card>
);

PageHeader.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.node,
  titleAdornment: PropTypes.node,
  subheader: PropTypes.node,
  actions: PropTypes.node
};

export default PageHeader;
