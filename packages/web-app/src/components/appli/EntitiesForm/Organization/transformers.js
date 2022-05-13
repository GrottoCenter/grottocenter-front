const makeOrganizationData = data => ({
  adress: data.organization.firstAdress,
  city: data.organization.city,
  country: data.organization.country,
  customMessage: data.organization.customMessage,
  latitude: data.organization.latitude,
  longitude: data.organization.longitude,
  mail: data.organization.mail,
  name: {
    text: data.organization.name,
    language: data.organization.language
  },
  postalCode: data.organization.zipCode,
  url: data.organization.url
});

export default makeOrganizationData;
