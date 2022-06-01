import { Typography, Box } from '@material-ui/core';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Skeleton } from '@material-ui/lab';
import { isEmpty } from 'ramda';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SubTitle = styled(Typography)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  text-transform: uppercase;
`;

const CreatedByTypography = styled(Typography)`
  display: flex;
  flex-direction: row;
`;

const CreatedBy = ({ name, creationDate }) => {
  const { formatMessage, formatDate, formatTime } = useIntl();

  return (
    <CreatedByTypography
      component="div"
      color="textSecondary"
      variant="caption"
      gutterBottom>
      <Box fontWeight="fontWeightLight">
        {`${formatMessage({ id: 'Created by' })}:`}
        &nbsp;
      </Box>
      <Box fontWeight="fontWeightBold">
        {`${name} (${formatDate(creationDate)} - ${formatTime(creationDate)})`}
      </Box>
    </CreatedByTypography>
  );
};

const Overview = ({
  createdBy,
  creationDate,
  authors,
  language,
  summary,
  loading
}) => {
  const { formatMessage } = useIntl();

  return (
    <div>
      <Header>
        {loading ? (
          <>
            <Skeleton variant="rect" width={100} />
            <Skeleton variant="rect" width={100} />
          </>
        ) : (
          <>
            <CreatedBy name={createdBy} creationDate={creationDate} />
            <Typography color="textSecondary" variant="caption" gutterBottom>
              {`${formatMessage({
                id: 'Document language'
              })}: ${formatMessage({ id: language })}`}
            </Typography>
          </>
        )}
      </Header>

      {loading ? (
        <Skeleton variant="rect" height={100} />
      ) : (
        <>
          {summary && (
            <>
              <SubTitle variant="subtitle1" color="textSecondary">
                {formatMessage({ id: 'Summary' })}
              </SubTitle>
              <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                {summary}
              </Typography>
            </>
          )}
          {!isEmpty(authors) && (
            <>
              <SubTitle variant="subtitle1" color="textSecondary">
                {formatMessage({ id: 'Authors' })}
              </SubTitle>
              <Typography variant="body1">
                {authors.map(
                  (auth, i) => `${auth} ${i < authors.length - 1 ? ' - ' : ''}`
                )}
              </Typography>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Overview;

CreatedBy.propTypes = {
  name: PropTypes.string.isRequired,
  creationDate: PropTypes.string.isRequired
};

Overview.propTypes = {
  loading: PropTypes.bool.isRequired,
  createdBy: PropTypes.string.isRequired,
  creationDate: PropTypes.string.isRequired,
  authors: PropTypes.arrayOf(PropTypes.string).isRequired,
  language: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired
};
