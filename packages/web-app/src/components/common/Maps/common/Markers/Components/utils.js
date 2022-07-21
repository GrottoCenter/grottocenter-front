// import { useIntl } from 'react-intl';

// export const makeCoordinatesValue = (latitude, longitude) => {
//   const { formatMessage } = useIntl();
//
//   return `${formatMessage({
//     id: 'Latitude',
//   })}: ${latitude.toFixed(4)} - ${formatMessage({
//     id: 'Longitude',
//   })}: ${longitude.toFixed(4)}`;
// };

// TODO handle translations
// eslint-disable-next-line import/prefer-default-export
export const makeCoordinatesValue = (latitude, longitude) =>
  `Lat: ${latitude.toFixed(4)} - Long: ${longitude.toFixed(4)}`;
