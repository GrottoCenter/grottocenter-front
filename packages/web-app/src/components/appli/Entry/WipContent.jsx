// eslint-disable-next-line react/prop-types
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import React from 'react';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';

const Content = ({ title, children }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: title })}
      content={
        isNil(children) ? <Typography>Work in progress</Typography> : children
      }
    />
  );
};

Content.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string
};

export default Content;
