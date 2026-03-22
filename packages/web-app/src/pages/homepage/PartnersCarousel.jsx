import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import AliceCarousel from 'react-alice-carousel';
import 'react-alice-carousel/lib/alice-carousel.css';

const PartnerVignette = styled('div')(({ theme }) => ({
  marginLeft: '2%',
  marginRight: '2%',
  marginTop: '2%',
  marginBottom: '2%',
  backgroundColor: 'white',
  border: `1px solid ${theme.palette.primary1Color}`,
  borderRadius: '2%',
  overflow: 'hidden',
  position: 'relative',
  display: 'inline-block',
  width: '90px',
  height: '90px',
  cursor: 'pointer',
  '@media (min-width: 354px) and (max-width: 515px)': {
    width: '85px',
    height: '85px'
  },
  '@media (min-width: 354px)': {
    marginRight: '1%',
    marginLeft: '1%'
  },
  '@media (min-width: 708px)': {
    width: '100px',
    height: '100px'
  }
}));

const PartnerImage = styled('img')`
  display: block;
  max-width: 100%;
  max-height: 100%;

  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const CarouselDiv = styled('div')(({ theme }) => ({
  textAlign: 'center',
  width: '100%',
  'li.alice-carousel__dots-item': {
    opacity: '50%',
    backgroundColor: theme.palette.accent1Color
  },
  'li.alice-carousel__dots-item.__active': {
    opacity: '100%',
    backgroundColor: theme.palette.accent1Color
  }
}));

const PartnerItem = ({ imagePath, name, onClick }) => (
  <PartnerVignette>
    <PartnerImage src={imagePath} alt={name} onClick={onClick} />
  </PartnerVignette>
);

PartnerItem.propTypes = {
  imagePath: PropTypes.string,
  name: PropTypes.string,
  onClick: PropTypes.func
};

const PartnersCarousel = ({ fetch, partners, isFetching }) => {
  const isFirstLoad = useRef(true);
  const rows = partners
    ? partners.map(({ id, pictureFileName, name }) => (
        <PartnerItem
          key={`partcs-${id}`}
          imagePath={`/images/partners/${pictureFileName}`}
          alt={name}
          onClick={() => window.open(`/ui/organizations/${id}`)}
        />
      ))
    : [];

  useEffect(() => {
    if (isFirstLoad.current) {
      fetch();
      isFirstLoad.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isFetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (rows.length > 0) {
    return (
      <CarouselDiv>
        <AliceCarousel
          mouseTracking
          disableButtonsControls
          autoPlayInterval={5000}
          autoPlay
          responsive={{
            0: { items: 3 },
            520: { items: 4 },
            1024: { items: 5 }
          }}
          items={rows}
        />
      </CarouselDiv>
    );
  }
  return null;
};

PartnersCarousel.propTypes = {
  fetch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  partners: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pictureFileName: PropTypes.string,
      name: PropTypes.string,
      customMessage: PropTypes.string
    })
  )
};

export default PartnersCarousel;
