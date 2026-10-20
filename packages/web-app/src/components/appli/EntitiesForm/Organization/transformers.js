import { normelizeCoordinate } from '../utils/InputCoordinate';

export const makeOrganizationData = ({ organization }) => ({
  ...(organization.organizationId != null && {
    id: organization.organizationId
  }),
  type: organization.type,
  address: organization.address,
  city: organization.city,
  country: { id: organization.country || null },
  customMessage: organization.customMessage,
  latitude: normelizeCoordinate(organization.latitude),
  longitude: normelizeCoordinate(organization.longitude),
  mail: organization.mail,
  name: {
    text: organization.name,
    language: organization.language
  },
  postalCode: organization.zipCode,
  url: organization.url
});

export const makeOrganizationValueData = data => ({
  type: data.type ?? '',
  name: data.name,
  customMessage: data.customMessage ?? '',
  language: data.language,
  address: data.address ?? '',
  zipCode: data.postalCode ?? '',
  city: data.city ?? '',
  country: data.country || null,
  mail: data.mail ?? '',
  url: data.url ?? '',
  latitude: data.latitude ?? '',
  longitude: data.longitude ?? '',
  organizationId: data.id
});
