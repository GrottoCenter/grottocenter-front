import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChevronIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import withTheme from '@mui/styles/withTheme';
import styled from 'styled-components';
import { breadcrumpKeys } from '../../../conf/config';
import GCLink from '../../common/GCLink';
import Translate from '../../common/Translate';

const BreadcrumpBar = withTheme(styled.div`
  color: ${props => props.theme.palette.primary1Color} !important;
  background-color: ${props => props.theme.palette.primary3Color} !important;
  padding: 0px !important;
  height: ${({ theme }) => theme.breadcrumpHeight}px;

  & > a,
  & > a:visited {
    font-weight: 300;
    color: ${props => props.theme.palette.primary1Color} !important;

    :hover,
    :active {
      font-weight: 600;
    }
  }

  & > svg {
    color: ${props => props.theme.palette.primary1Color} !important;
  }
`);

const StyledLink = styled(GCLink)`
  text-decoration: none;
  position: relative;
  top: -7px;

  & > span {
    font-size: small;
  }
`;

const StyledHomeIcon = styled(HomeIcon)`
  padding-right: 5px;
`;

const Breadcrump = () => {
  const location = useLocation();
  const [breadcrump, setBreadcrump] = useState([]);

  useEffect(() => {
    const path = location.pathname;
    const cutPath = path.split('/');
    let itr = 0;
    const newBreadcrump = [];
    cutPath.forEach(item => {
      if (item.trim().length > 0) {
        itr += 1;
        if (newBreadcrump.length > 0) {
          newBreadcrump.push(<ChevronIcon key={`c${item}`} />);
        }
        if (breadcrumpKeys[item]) {
          const link = cutPath.reduce(
            (previousValue, currentValue, currentIndex) => {
              if (currentIndex <= itr) {
                return `${previousValue}/${currentValue}`;
              }
              return previousValue;
            }
          );
          newBreadcrump.push(
            <StyledLink internal href={link} key={`l${item}`}>
              <Translate>{breadcrumpKeys[item]}</Translate>
            </StyledLink>
          );
        }
      }
    });
    setBreadcrump(newBreadcrump);
  }, [location]);

  return (
    <BreadcrumpBar>
      <StyledHomeIcon />
      {breadcrump}
    </BreadcrumpBar>
  );
};

export default Breadcrump;
