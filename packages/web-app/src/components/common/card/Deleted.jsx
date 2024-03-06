import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Button } from '@mui/material';
import Alert from '../Alert';
import AuthorAndDate from '../Contribution/AuthorAndDate';
import Layout from '../Layouts/Fixed/FixedContent';
import authorType from '../../../types/author.type';
import { Property } from '../Properties';

export const DELETED_ENTITIES = {
  entrance: { str: 'Entrance', url: '/ui/entrances/' },
  massif: { str: 'Massif', url: '/ui/massifs/' },
  organization: { str: 'Organization', url: '/ui/organizations/' },
  document: { str: 'Document', url: '/ui/documents/' },
  network: { str: 'Network', url: '/ui/networks/' }
};

export const StyledLink = styled('div')`
  padding-top: ${({ theme }) => theme.spacing(3)};
`;
export const StyledAuthor = styled('div')`
  display: inline-grid;
  padding-top: ${({ theme }) => theme.spacing(3)};
  padding-left: ${({ theme }) => theme.spacing(1)};
`;
const Deleted = ({
  redirectTo,
  entity,
  name,
  creationDate,
  dateReviewed,
  author,
  reviewer,
  location
}) => {
  const { formatMessage } = useIntl();
  const entityI18n = formatMessage({ id: entity.str });
  const redirectToUrl = redirectTo ? entity.url + redirectTo : null;
  return (
    <Layout
      title={name}
      content={
        <>
          <Alert
            disableMargins
            severity="warning"
            title={formatMessage(
              {
                id: 'deleted-card-intro-message',
                defaultMessage: 'This {entity} has been deleted'
              },
              { entity: entityI18n }
            )}
            content={
              <>
                {!!location && (
                  <Property
                    label={formatMessage({ id: 'Location' })}
                    value={location}
                  />
                )}
                <StyledAuthor>
                  <AuthorAndDate author={author} date={creationDate} />
                  {reviewer && (
                    <AuthorAndDate
                      author={reviewer}
                      date={dateReviewed}
                      verb="Deleted"
                    />
                  )}
                </StyledAuthor>
              </>
            }
          />
          {!!redirectToUrl && (
            <StyledLink>
              <Button
                variant="contained"
                color="secondary"
                href={redirectToUrl}>
                {formatMessage(
                  {
                    id: 'deleted-card-go-to-related-btn',
                    defaultMessage: 'Go to the linked {entity}'
                  },
                  { entity: entityI18n }
                )}
              </Button>
            </StyledLink>
          )}
        </>
      }
    />
  );
};

Deleted.propTypes = {
  redirectTo: PropTypes.number,
  entity: PropTypes.shape({
    str: PropTypes.string,
    url: PropTypes.string
  }),
  name: PropTypes.string,
  author: authorType,
  creationDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  reviewer: authorType,
  dateReviewed: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  location: PropTypes.string
};

export default Deleted;
