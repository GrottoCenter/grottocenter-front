import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

// Inlined from the former Skeleton-CSS `.container` (deleted with the rest of
// the framework). LandingSection was its only consumer. The 400px/550px
// breakpoints and the 20px gutter are Skeleton's own values, kept verbatim so
// the homepage layout is unchanged — they are not part of the MUI scale.
const Container = styled('div')`
  position: relative;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box;

  @media (min-width: 400px) {
    width: 85%;
    padding: 0;
  }

  @media (min-width: 550px) {
    width: 80%;
  }
`;

const Section = ({ className, children }) => (
  <div className={className}>
    <Container>{children}</Container>
  </div>
);

Section.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

const LandingSection = styled(Section)`
  clear: both;
  padding: 40px 0;
  background-color: ${props => props.bgColor};
  color: ${props => props.fgColor};
`;

export default LandingSection;
