import NewsCard from './NewsCard';

const meta = {
  title: 'Common/NewsCard',
  component: NewsCard,
  parameters: { layout: 'padded' },
  args: {
    title: 'News from the Wikicaves community',
    text: 'Discover the latest projects and activities of the association and the cavers contributing to Grottocenter.',
    day: 6,
    month: 'Nov',
    image: '/images/caves/draperie_small.jpg',
    linkMore: 'https://blog-en.grottocenter.org/'
  }
};

export default meta;

export const Default = {};

export const WithoutImage = { args: { image: null } };

export const BrokenImage = { args: { image: '/missing-blog-image.jpg' } };

export const WithoutLink = { args: { linkMore: null } };

export const Loading = {
  args: { showSpinner: true, title: null, text: null }
};

export const Unavailable = { args: { title: null, text: null } };
