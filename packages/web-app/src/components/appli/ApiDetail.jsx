import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SwaggerUIBundle from 'swagger-ui-dist/swagger-ui-bundle';
import Card from '@material-ui/core/Card';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled from 'styled-components';

const StyledWrapper = withTheme(styled.div`
  color: ${props => props.theme.palette.textIconColor};
`);

const StyledCard = withStyles({
  root: {
    width: '80%',
    margin: 'auto',
    paddingRight: '40px',
    paddingBottom: '20px'
  }
})(Card);

class ApiDetail extends Component {
  componentDidMount() {
    const { version } = this.props;
    if (version) {
      SwaggerUIBundle({
        url: `/swagger/apiV${version}.yaml`,
        dom_id: '#swaggerContainer',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis]
      });
    }
  }

  render() {
    return (
      <StyledWrapper>
        <StyledCard>
          <div id="swaggerContainer" />
        </StyledCard>
      </StyledWrapper>
    );
  }
}

ApiDetail.propTypes = {
  version: PropTypes.number.isRequired
};

export default ApiDetail;
