import { shape, string } from 'prop-types';

const intactDescription = shape({
  language: shape({
    refName: string
  }),
  title: string,
  description: string
});

export default intactDescription;
