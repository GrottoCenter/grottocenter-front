import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChevronIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import { styled } from '@mui/material/styles';
import { breadcrumpKeys } from '../../../conf/config';
import GCLink from '../../common/GCLink';
import Translate from '../../common/Translate';

const BreadcrumpBar = styled('div')(({ theme }) => ({
  color: `${theme.palette.primary1Color} !important`,
  backgroundColor: `${theme.palette.primary3Color} !important`,
  padding: '0px !important',
  height: theme.breadcrumpHeight,

  '& > a,  & > a:visited': {
    fontWeight: 300,
    color: `${theme.palette.primary1Color} !important`,

    ':hover, :active': {
      fontWeight: 600
    }
  },

  '& > svg': {
    color: `${theme.palette.primary1Color} !important`
  }
}));

const StyledLink = styled(GCLink)(() => ({
  textDecoration: 'none',
  position: 'relative',
  top: '-7px',

  '& > span': {
    fontSize: 'small'
  }
}));

const StyledHomeIcon = styled(HomeIcon)(() => ({
  paddingRight: '5px'
}));

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
