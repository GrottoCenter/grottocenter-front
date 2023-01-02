import React from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/GetApp';
import { useIntl } from 'react-intl';
import { ENTRANCE, DOCUMENT } from './constants';

const PREFIX = 'ImportKarstlinkInfo';

const classes = {
  karstlinkFooter: `${PREFIX}-karstlinkFooter`,
  karstlinkButton: `${PREFIX}-karstlinkButton`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')({
  [`& .${classes.karstlinkFooter}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 'auto'
  },

  [`& .${classes.karstlinkButton}`]: {
    width: 'fit-content',
    margin: '0 0 0 1rem'
  }
});

const KarstlinkLogo = styled('img')`
  width: 15%;
  height: 15%;
  border-radius: 0.5rem;
`;

const KarstlinkParagraph = styled('p')`
  text-align: justify;
  font-weight: 300;
  font-size: large;
`;

const ImportKarstlinkInfo = ({ selectType }) => {
  const { formatMessage } = useIntl();

  let title = '';
  let link = '';
  switch (selectType) {
    case ENTRANCE:
      title = 'Example - Entrance';
      link = 'https://ontology.uis-speleo.org/example/V4.csv';
      break;
    case DOCUMENT:
      title = 'Example - Document';
      link = 'https://ontology.uis-speleo.org/example/Prospection.csv';
      break;
    default:
      break;
  }

  return (
    <Root>
      <div>
        <KarstlinkParagraph>
          {formatMessage({
            id: 'You have probably wondered how to find data on caves?'
          })}
          &nbsp;
          {formatMessage({
            id: 'How to connect the caves to the documents that mention them?'
          })}
          &nbsp;
          {formatMessage({
            id: 'How to create links between scientific observations, the measurements made by the sensors and the cavities in which these observations and measurements were carried out?'
          })}
          &nbsp;
          {formatMessage({
            id: 'This is some of what the KarstLink project offers.'
          })}
        </KarstlinkParagraph>
      </div>
      <div className={classes.karstlinkFooter}>
        <KarstlinkLogo src="/images/importCsv/karstlinkLogo.svg" />
        <div>
          <Button
            target="_blank"
            href="https://ontology.uis-speleo.org/ontology/"
            className={classes.karstlinkButton}
            variant="contained"
            startIcon={<InfoIcon />}>
            {formatMessage({
              id: 'Find out'
            })}
          </Button>
          <Button
            target="_blank"
            href={link}
            className={classes.karstlinkButton}
            variant="contained"
            startIcon={<DownloadIcon />}>
            {formatMessage({
              id: title
            })}
          </Button>
        </div>
      </div>
    </Root>
  );
};
ImportKarstlinkInfo.propTypes = {
  selectType: PropTypes.number.isRequired
};

export default ImportKarstlinkInfo;
