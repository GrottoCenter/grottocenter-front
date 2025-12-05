import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import CheckIcon from '@mui/icons-material/Check';
import Card from '@mui/material/Card';
import CardTitle from '@mui/material/CardHeader';
import CardText from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import { styled } from '@mui/material/styles';
import { useSelector } from 'react-redux';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {
  pftGdLink,
  contributorsLink,
  contributeLinks
} from '../../conf/externalLinks';
import Translate from '../common/Translate';

const FaqDiv = styled('div')`
  margin: 20px;
`;

const StyledCard = styled(Card)({
  marginBottom: '20px'
});

const StyledCardHeader = styled(CardTitle)(({ theme }) => ({
  backgroundColor: theme.palette.secondary1Color,
  '& .MuiCardHeader-title': {
    color: theme.palette.secondaryBlocTitle
  }
}));

const StyledCardText = styled(CardText)(({ theme }) => ({
  backgroundColor: theme.palette.textIconColor
}));

const ItemList = styled('ul')`
  list-style-type: none;
`;

const StyledCheckIcon = styled(CheckIcon)(({ theme }) => ({
  color: theme.palette.accent1Color
}));
const FaqCard = ({ title, children }) => {
  const [show, setShow] = React.useState(false);
  return (
    <StyledCard>
      <StyledCardHeader
        title={<Translate id={title} />}
        onClick={() => setShow(prev => !prev)}
      />

      <Collapse in={show} timeout="auto" unmountOnExit>
        <StyledCardText>{children}</StyledCardText>
      </Collapse>
    </StyledCard>
  );
};

FaqCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

const Faq = () => {
  const { formatMessage } = useIntl();
  const { locale } = useSelector(state => state.intl);
  const contributeLink =
    contributeLinks[locale] !== undefined
      ? contributeLinks[locale]
      : contributeLinks['*'];

  return (
    <FaqDiv>
      <FaqCard
        title={formatMessage({
          id: 'I would like to share some of my work but some caves should remain protected. How are you planning to protect them?'
        })}>
        <Translate id="Here is the procedure that will be implemented in next version of GrottoCenter. Is that acceptable for you?" />
        <br />
        <GCLink href={pftGdLink} alt="Link to google document">
          {pftGdLink}
        </GCLink>
      </FaqCard>

      <FaqCard
        title={formatMessage({
          id: 'How can you guarantee the quality of the data on GrottoCenter?'
        })}>
        <Translate id="The Wikicaves association has signed partnership with clubs and federations which provide data and which are informed of all the actions carried out. Besides we have routine softwares that regularly check the quality of the data." />
      </FaqCard>

      <FaqCard
        title={formatMessage({
          id: 'I find your project interesting: How can I help?'
        })}>
        <ItemList className="listing">
          <li>
            <StyledCheckIcon />
            <Translate
              id="You can show your support by  joining  Grottocenter {0}"
              values={{
                0: (
                  <GCLink href={contributeLink} alt="Link to become a member">
                    <Translate key="member" id="as active member" />
                  </GCLink>
                )
              }}
            />
          </li>
          <li>
            <StyledCheckIcon />
            <Translate
              id="Here is another way: In order to share with the greatest number, we are  always  {0}"
              values={{
                0: (
                  <GCLink
                    href={contributeLink}
                    alt="Link to become a translator">
                    <Translate key="translator" id="looking for translators" />
                  </GCLink>
                )
              }}
            />
          </li>
          <li>
            <StyledCheckIcon />
            <Translate
              id="If you have programming skills how about  {0}"
              values={{
                0: (
                  <GCLink
                    href={contributeLink}
                    alt="Link to become a developer">
                    <Translate key="developer" id="joining our team of developers" />
                  </GCLink>
                )
              }}
            />
          </li>
          <li>
            <StyledCheckIcon />
            <Translate
              id="As a group, a club or  federation,  {0} : The project will move on thanks to  organizations such as yours"
              values={{
                0: (
                  <GCLink href={contributeLink} alt="Link to become a partner">
                    <Translate key="partner" id="you can be  one of our partners" />
                  </GCLink>
                )
              }}
            />
          </li>
        </ItemList>
      </FaqCard>

      <FaqCard
        title={formatMessage({
          id: 'One of my caving buddies told me I should NOT post anything at all on GrottoCenter. That sometimes makes it hard to contribute!'
        })}>
        <Translate id="Yes, it may be very difficult!!!! But perhaps we should all be aware that the world is changing." />
      </FaqCard>

      <FaqCard title={formatMessage({ id: 'Who is behind GrottoCenter?' })}>
        <Translate id="We have our wiki: this is where you can find us." />
        <br />
        <InternationalizedLink
          links={contributorsLink}
          alt="Link to contribution page"
        />
      </FaqCard>

      <FaqCard
        title={formatMessage({
          id: 'I want to share my data only with fellow cavers. Is it possible on GrottoCenter?'
        })}>
        <Translate id="On GrottoCenter, data is placed under free licence, it is accessible to all those who may need it." />
      </FaqCard>
    </FaqDiv>
  );
};

export default Faq;
