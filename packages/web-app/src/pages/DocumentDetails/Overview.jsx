import { Typography } from '@material-ui/core';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Skeleton } from '@material-ui/lab';
import { isEmpty } from 'ramda';
import AuthorAndDate from '../../components/common/Contribution/AuthorAndDate';
import authorType from '../../types/author.type';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SubTitle = styled(Typography)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  text-transform: uppercase;
`;

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
            <AuthorAndDate
              author={author}
              textColor="textSecondary"
              date={creationDate}
              verb="Created"
            />
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
                  <React.Fragment key={auth.id}>
                    <a href={auth.url}>{auth.nickname}</a>
                    {i < authors.length - 1 ? ' - ' : ''}
                  </React.Fragment>
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

Overview.propTypes = {
  loading: PropTypes.bool.isRequired,
  author: authorType,
  creationDate: PropTypes.string.isRequired,
  authors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      nickname: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    })
  ),
  language: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired
};
