import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/GetApp';
import { useIntl } from 'react-intl';
import { ENTRANCE, DOCUMENT } from './constants';

const useStyles = makeStyles({
  karstlinkFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 'auto'
  },

  karstlinkButton: {
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
  const classes = useStyles();

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
    <>
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
    </>
  );
};
ImportKarstlinkInfo.propTypes = {
  selectType: PropTypes.number.isRequired
};

export default ImportKarstlinkInfo;
