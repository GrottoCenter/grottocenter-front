import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import Alert from '../../common/Alert';
import Translate from '../../common/Translate';
import { Property } from '../../common/Properties';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import authorType from '../../../types/author.type';

export const StyledLink = styled.div`
  padding-top: ${({ theme }) => theme.spacing(3)}px;
`;
export const StyledAuthor = styled.div`
  display: inline-grid;
  padding-top: ${({ theme }) => theme.spacing(3)}px;
  padding-left: ${({ theme }) => theme.spacing(1)}px;
`;

const DeletedEntrance = ({
  redirectTo,
  name,
  localisation,
  creationDate,
  dateReviewed,
  author,
  reviewer
}) => {
  const { formatMessage } = useIntl();
  return (
    <Layout
      title={name}
      content={
        <>
          <Alert
            disableMargins
            severity="warning"
            title={formatMessage({ id: 'This entrance has been deleted' })}
            content={
              <>
                <Property
                  label={formatMessage({ id: 'Localisation' })}
                  value={localisation}
                />
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
          {!!redirectTo && (
            <StyledLink>
              <Button
                variant="contained"
                color="secondary"
                href={`/ui/entrances/${redirectTo}`}>
                <Translate id="Go to the linked entrance" />
              </Button>
            </StyledLink>
          )}
        </>
      }
    />
  );
};

DeletedEntrance.propTypes = {
  redirectTo: PropTypes.number,
  name: PropTypes.string,
  localisation: PropTypes.string,
  author: authorType,
  creationDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  reviewer: authorType,
  dateReviewed: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ])
};

export default DeletedEntrance;
