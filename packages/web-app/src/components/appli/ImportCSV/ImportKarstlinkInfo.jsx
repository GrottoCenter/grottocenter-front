import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Box, Button, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/GetApp';
import { useIntl } from 'react-intl';
import AppLink from '../../common/AppLink';
import { ENTRANCE, DOCUMENT } from './constants';

const KARSTLINK_URL = 'https://ontology.uis-speleo.org/ontology/';

// The logo doubles as the "learn more about KarstLink" link (brand-logo-as-link
// convention), so a separate button for the same target is no longer needed.
const KarstlinkLogoLink = styled(AppLink)`
  display: inline-flex;
  border-radius: 0.5rem;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
  }
`;

const KarstlinkLogo = styled('img')`
  height: 38px;
  width: auto;
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

  const findOutLabel = formatMessage({ id: 'Find out' });

  return (
    <>
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

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 4,
          mt: 3
        }}>
        <Tooltip title={findOutLabel}>
          <KarstlinkLogoLink href={KARSTLINK_URL} aria-label={findOutLabel}>
            <KarstlinkLogo
              src="/images/importCsv/karstlinkLogo.svg"
              alt="KarstLink"
            />
          </KarstlinkLogoLink>
        </Tooltip>
        <Button
          target="_blank"
          rel="noopener noreferrer"
          href={link}
          variant="outlined"
          startIcon={<DownloadIcon />}>
          {formatMessage({ id: title })}
        </Button>
      </Box>
    </>
  );
};
ImportKarstlinkInfo.propTypes = {
  selectType: PropTypes.number.isRequired
};

export default ImportKarstlinkInfo;
