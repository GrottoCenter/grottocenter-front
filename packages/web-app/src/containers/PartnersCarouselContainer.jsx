import { usePartnersCarousel } from '../hooks';
import PartnersCarousel from '../pages/homepage/PartnersCarousel';

const noop = () => {};

const PartnersCarouselContainer = () => {
  const { data: partners, isPending } = usePartnersCarousel();
  return (
    <PartnersCarousel partners={partners} isFetching={isPending} fetch={noop} />
  );
};

export default PartnersCarouselContainer;
