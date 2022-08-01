import { Typography, Box } from '@material-ui/core';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Skeleton } from '@material-ui/lab';
import { isEmpty } from 'ramda';
import AuthorLink from '../../components/common/AuthorLink/index';

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

const CreatedBy = ({ author, creationDate }) => {
  const { formatDate, formatTime } = useIntl();

  return (
    <CreatedByTypography
      component="div"
      color="textSecondary"
      variant="caption"
      gutterBottom>
      <Box fontWeight="fontWeightBold">
        <AuthorLink author={author} verb="Created" />
        {` `}({formatDate(creationDate)}
        {' - '}
        {formatTime(creationDate)})
      </Box>
    </CreatedByTypography>
  );
};

const Overview = ({
  author,
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
            <CreatedBy author={author} creationDate={creationDate} />
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
                {authors.map((auth, i) => (
                  <>
                    <a href={auth.url}>{auth.fullName}</a>
                    {i < authors.length - 1 ? ' - ' : ''}
                  </>
                ))}
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
  author: PropTypes.shape({
    id: PropTypes.number,
    nickname: PropTypes.string,
    url: PropTypes.string
  }),
  creationDate: PropTypes.string.isRequired
};

Overview.propTypes = {
  loading: PropTypes.bool.isRequired,
  author: PropTypes.shape({
    id: PropTypes.number,
    nickname: PropTypes.string,
    url: PropTypes.string
  }),
  creationDate: PropTypes.string.isRequired,
  authors: PropTypes.arrayOf({
    fullName: PropTypes.string.isRequired
  }),
  language: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired
};
