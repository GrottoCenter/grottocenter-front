import React from 'react';
import { styled } from '@mui/material/styles';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText
} from '@mui/material';
import { useIntl } from 'react-intl';
import { Launch, MenuBook } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import InternationalizedLink from '../InternationalizedLink';
import {
  licenceLinks,
  licensesODBLink,
  userguideLinks
} from '../../../conf/externalLinks';
import GCLogo from '../GCLogo';
import Translate from '../Translate';

const LogoFooter = styled(GCLogo)`
  & > img {
    height: 40px;
    margin-top: 13px;
    padding-left: 10px;
    padding-right: 10px;
  }
`;

const LicenceImage = styled('img')`
  width: 75px;
`;

const Container = styled('div')`
  margin-top: auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const Spaced = styled('div')`
  text-align: center;
  flex: 1;
`;

const WikiContainer = styled('div')`
  margin-top: auto;
  flex: auto;
  flex-direction: row;
  justify-content: space-between;
`;

const Footer = () => {
  const { formatMessage } = useIntl();
  const { locale } = useSelector(state => state.intl);
  const linkUrl =
    userguideLinks[locale] !== undefined
      ? userguideLinks[locale]
      : userguideLinks['*'];
  return (
    <Container>
      <WikiContainer>
        <List>
          <ListItem
            button
            component="a"
            href={linkUrl}
            target="_blank"
            rel="noreferrer">
            <ListItemIcon>
              <MenuBook color="primary" />
            </ListItemIcon>
            <ListItemText>
              <Translate>User guide</Translate>
            </ListItemText>
            <ListItemSecondaryAction>
              <Launch fontSize="small" color="action" />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </WikiContainer>
      <Spaced>
        <LogoFooter />
      </Spaced>
      <Spaced>
        <InternationalizedLink links={licensesODBLink}>
          <LicenceImage
            src="/images/odbl.png"
            alt="ODBL license"
            title={formatMessage({
              id: 'The ODBL license applies to all data that is not copyrighted.'
            })}
          />
        </InternationalizedLink>
        <InternationalizedLink links={licenceLinks}>
          <LicenceImage
            src="/images/CC-BY-SA.png"
            alt="CC-BY-SA licence"
            title={formatMessage({
              id: 'Unless stated otherwise, the CC-BY-SA license applies for documents and texts subject to copyright.'
            })}
          />
        </InternationalizedLink>
      </Spaced>
    </Container>
  );
};

export default Footer;
