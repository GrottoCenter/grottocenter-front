import React from 'react';
import { useIntl } from 'react-intl';
import { Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import ActionButton from '../../ActionButton';

const margin = '20px';

const Title = ({ children }) => (
  <Typography variant="h2" color="secondary">
    {children}
  </Typography>
);

const StyledGrid = styled(Grid)`
  margin-top: ${({ theme }) => theme.spacing(2)}px;
  margin-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const TitleLine = ({ title1, title2, handleAllClick1, handleAllClick2 }) => {
  const { formatMessage } = useIntl();
  return (
    <StyledGrid container direction="row">
      <Grid container item xs={4} justifyContent="flex-start">
        <Title>
          {formatMessage(
            {
              id: 'title duplicate',
              defaultMessage: '{title}'
            },
            {
              title: title1
            }
          )}
        </Title>
        <ActionButton
          label={formatMessage({ id: 'Take all' })}
          onClick={handleAllClick1}
          style={{ marginLeft: margin }}
        />
      </Grid>
      <Grid container item xs={4} justifyContent="center">
        <Title>{formatMessage({ id: 'Final result' })}</Title>
      </Grid>
      <Grid container item xs={4} justifyContent="flex-end">
        <Title>
          {formatMessage(
            {
              id: 'title duplicate',
              defaultMessage: '{title}'
            },
            {
              title: title2
            }
          )}
        </Title>
        <ActionButton
          label={formatMessage({ id: 'Take all' })}
          onClick={handleAllClick2}
          style={{ marginRight: margin }}
        />
      </Grid>
    </StyledGrid>
  );
};

export default React.memo(TitleLine);

TitleLine.propTypes = {
  title1: PropTypes.string.isRequired,
  title2: PropTypes.string.isRequired,
  handleAllClick1: PropTypes.func.isRequired,
  handleAllClick2: PropTypes.func.isRequired
};

Title.propTypes = {
  children: PropTypes.node.isRequired
};
