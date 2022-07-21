export const makePostOrganizationData = data => ({
  address: data.organization.firstAdress,
  city: data.organization.city,
  country: { id: data.organization.country },
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

export const makePutOrganizationData = (data, defaultValues) => {
  const myObj = {};
  myObj.id = defaultValues.organizationId;
  myObj.address = data.organization.firstAdress;
  myObj.city = data.organization.city;
  myObj.country = { id: data.organization.country };
  myObj.customMessage = data.organization.customMessage;
  myObj.latitude = data.organization.latitude;
  myObj.longitude = data.organization.longitude;
  myObj.mail = data.organization.mail;
  myObj.postalCode = data.organization.zipCode;
  myObj.url = data.organization.url;

  return myObj;
};

export const makeOrganizationValueData = data => ({
  name: data.name,
  isPartner: data.isOfficialPartner,
  customMessage: data.customMessage,
  language: data.names[0].language,
  firstAdress: data.address || null,
  zipCode: data.postalCode || null,
  city: data.city || null,
  country: data.country || null,
  mail: data.mail || null,
  url: data.url || null,
  latitude: data.latitude || null,
  longitude: data.longitude || null,
  organizationId: data.id,
  nameId: data.names[0].id
});
