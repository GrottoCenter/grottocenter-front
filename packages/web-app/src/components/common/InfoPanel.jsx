import PropTypes from 'prop-types';
import { Paper } from '@mui/material';
import InfoSection from './InfoSection';

const InfoPanel = ({
  title,
  component = 'h2',
  icon,
  titleColor,
  children,
  testId,
  sx = []
}) => (
  <Paper
    variant="outlined"
    data-testid={testId}
    sx={[
      { p: 1, borderRadius: 2, bgcolor: 'grey.50' },
      ...(Array.isArray(sx) ? sx : [sx])
    ]}>
    {title ? (
      <InfoSection
        title={title}
        component={component}
        icon={icon}
        titleColor={titleColor}>
        {children}
      </InfoSection>
    ) : (
      children
    )}
  </Paper>
);

InfoPanel.propTypes = {
  title: InfoSection.propTypes.title,
  component: InfoSection.propTypes.component,
  icon: PropTypes.node,
  titleColor: InfoSection.propTypes.titleColor,
  children: PropTypes.node.isRequired,
  testId: PropTypes.string,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func])
};

export default InfoPanel;
