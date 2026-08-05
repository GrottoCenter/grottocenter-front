import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

const SectionWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

const TitleRow = styled(Box)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
`;

/**
 * Subsection heading inside a section card — the third and last heading role
 * (page title / section title / subsection title).
 *
 * Size and outline level are deliberately decoupled:
 * - `variant="h5"` (16px/600) is the *visual* scale — the same token as
 *   `FormSection` in the entity forms, which labels the equivalent thing (a
 *   group of fields vs. a group of properties). Keep the two in step.
 * - `component` is the *outline* level, and defaults to `h3` — correct inside a
 *   titled <ScrollableContent> (an <h2>). Pass `component="h2"` when the parent
 *   card has no title of its own, otherwise the outline skips from h1 to h3.
 */
const InfoSection = ({
  title,
  icon = null,
  titleColor = undefined,
  component = 'h3',
  children
}) => (
  <SectionWrapper>
    {title && (
      <TitleRow>
        {icon}
        <Typography variant="h5" component={component} color={titleColor}>
          {title}
        </Typography>
      </TitleRow>
    )}
    {children}
  </SectionWrapper>
);

InfoSection.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.node,
  titleColor: PropTypes.string,
  component: PropTypes.elementType,
  children: PropTypes.node.isRequired
};

export default InfoSection;
