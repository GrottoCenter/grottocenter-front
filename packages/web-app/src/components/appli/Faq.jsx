import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import Card from '@material-ui/core/Card';
import CardTitle from '@material-ui/core/CardHeader';
import CardText from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {
  pftGdLink,
  contributorsLink,
  contributeLinks
} from '../../conf/Config';
import Translate from '../common/Translate';

const FaqDiv = styled.div`
  margin: 20px;
`;

const StyledCard = withStyles(
  // eslint-disable-next-line no-unused-vars
  theme => ({
    root: {
      marginBottom: '20px'
    }
  }),
  { withTheme: true }
)(Card);

const StyledCardHeader = withStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.secondary1Color
    },
    title: {
      color: theme.palette.secondaryBlocTitle
    }
  }),
  { withTheme: true }
)(CardTitle);

const StyledCardText = withStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.textIconColor
    }
  }),
  { withTheme: true }
)(CardText);

const ItemList = styled.ul`
  list-style-type: none;
`;

const StyledCheckIcon = withStyles(
  theme => ({
    root: {
      color: theme.palette.accent1Color
    }
  }),
  { withTheme: true }
)(CheckIcon);

const Faq = () => {
  const { locale } = useSelector(state => state.intl);
  const [state, setState] = {
    block1: false,
    block2: false,
    block3: false,
    block4: false,
    block5: false,
    block6: false
  };
  const contributeLink =
    contributeLinks[locale] !== undefined
      ? contributeLinks[locale]
      : contributeLinks['*'];

  return (
    <FaqDiv>
      <StyledCard>
        <StyledCardHeader
          title={
            <Translate id="I would like to share some of  my work but some caves should remain protected How  are you planning to protect them ?" />
          }
          onClick={() =>
            setState(prevState => ({ ...prevState, block1: !prevState.block1 }))
          }
        />

        <Collapse in={state.block1} timeout="auto" unmountOnExit>
          <StyledCardText>
            <Translate id="Here   is the procedure that  will be implemented in next version of Grottocenter  Is that acceptable for you?" />
            <br />
            <GCLink href={pftGdLink} alt="Link to google document">
              {pftGdLink}
            </GCLink>
          </StyledCardText>
        </Collapse>
      </StyledCard>

      <StyledCard>
        <StyledCardHeader
          title={
            <Translate id="How can you guarantee the quality of the data  on Grottocenter ?" />
          }
          onClick={() =>
            setState(prevState => ({ ...prevState, block2: !prevState.block2 }))
          }
        />

        <Collapse in={state.block2} timeout="auto" unmountOnExit>
          <StyledCardText>
            <Translate id="The Wikicaves association has signed partnership with clubs and federations which provide data and which are informed of all the actions carried out besides we  have routine programmes that  regularly  check the quality of the data" />
          </StyledCardText>
        </Collapse>
      </StyledCard>

      <StyledCard>
        <StyledCardHeader
          title={
            <Translate id="I find your project interesting:  How  can I  help ?" />
          }
          onClick={() =>
            setState(prevState => ({ ...prevState, block3: !prevState.block3 }))
          }
        />

        <Collapse in={state.block3} timeout="auto" unmountOnExit>
          <StyledCardText>
            <ItemList className="listing">
              <li>
                <StyledCheckIcon />
                <Translate
                  id="You can show your support by  joining  Grottocenter {0}"
                  values={{
                    0: (
                      <GCLink
                        href={contributeLink}
                        alt="Link to become a member">
                        <Translate id="as active member" />
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
                        <Translate id="looking for translators" />
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
                        <Translate id="joining our team of developpers" />
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
                      <GCLink
                        href={contributeLink}
                        alt="Link to become a partner">
                        <Translate id="you can be  one of our partners" />
                      </GCLink>
                    )
                  }}
                />
              </li>
            </ItemList>
          </StyledCardText>
        </Collapse>
      </StyledCard>

      <StyledCard>
        <StyledCardHeader
          title={
            <Translate id="One of my caving  buddies  told me I should NOT  post anything at  all on Grottocenter That sometimes makes it  hard to contribute !" />
          }
          onClick={() =>
            setState(prevState => ({ ...prevState, block4: !prevState.block4 }))
          }
        />

        <Collapse in={state.block4} timeout="auto" unmountOnExit>
          <StyledCardText>
            <Translate id="Yes, it may be  very difficult!!!!  But perhaps  we should all  be aware that  the world  is  changing" />
          </StyledCardText>
        </Collapse>
      </StyledCard>

      <StyledCard>
        <StyledCardHeader
          title={<Translate id="Who are  you  at  Grottocenter ?" />}
          onClick={() =>
            setState(prevState => ({ ...prevState, block5: !prevState.block5 }))
          }
        />

        <Collapse in={state.block5} timeout="auto" unmountOnExit>
          <StyledCardText>
            <Translate id="We have our  wiki:  this is where you can find us" />
            <br />
            <InternationalizedLink
              links={contributorsLink}
              alt="Link to contribution page"
            />
          </StyledCardText>
        </Collapse>
      </StyledCard>

      <StyledCard>
        <StyledCardHeader
          title={
            <Translate id="I want to share my data only with fellow cavers Is it possible on Grottocenter?" />
          }
          onClick={() =>
            setState(prevState => ({ ...prevState, block6: !prevState.block6 }))
          }
        />

        <Collapse in={state.block6} timeout="auto" unmountOnExit>
          <StyledCardText>
            <Translate id="Data, on Grottocenter,  is placed under free licence, it is accessible to all those who may need  it" />
          </StyledCardText>
        </Collapse>
      </StyledCard>
    </FaqDiv>
  );
};

export default Faq;
