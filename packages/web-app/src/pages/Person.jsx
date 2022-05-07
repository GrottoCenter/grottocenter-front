import React, { useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil, pathOr } from 'ramda';
import Person from '../components/appli/Person/Person';
import { loadPerson } from '../actions/Person';
import { useUserProperties, usePermissions } from '../hooks';

const PersonPage = () => {
  const { personId } = useParams();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { person, error, isFetching } = useSelector(state => state.person);
  const userId = pathOr(null, ['id'], useUserProperties());
  // eslint-disable-next-line eqeqeq
  const isAllowed = userId == personId || permissions.isAdmin;

  const history = useHistory();
  const editPath = useRef('/ui');

  useEffect(() => {
    dispatch(loadPerson(personId));
    editPath.current = `/ui/person/edit/${personId}`;
  }, [personId, dispatch]);
  // return <Person person={person} personId={id} />;

  const onEdit = () => {
    history.push(editPath.current);
  };
  // eslint-disable-next-line
  console.log(person);
  return (
    <Person
      isFetching={isFetching || !isNil(error)}
      person={person}
      personId={personId}
      onEdit={onEdit}
      isAllowed={isAllowed}
    />
  );
};
export default PersonPage;

/* const testUser = {
  id: 4,
  groups: [
    {
      id: 5,
      name: 'Leader',
      comments: 'Contributors can refer to those people for any questions.'
    },
    {
      id: 3,
      name: 'groupeTest'
    }
  ],
  name: 'Léa',
  nickname: 'LéaLead',
  surname: 'Lead',
  language: 'fra',
  documents: [
    {
      id: 16746,
      dateInscription: '2018-06-23T16:38:47.000Z',
      dateValidation: '2020-12-22T00:14:06.621Z',
      datePublication: null,
      dateReviewed: null,
      isValidated: true,
      issue: null,
      validationComment: null,
      authorComment: null,
      pages: null,
      identifier: null,
      refBbs: null,
      isDeleted: false,
      modifiedDocJson: null,
      idDbImport: null,
      nameDbImport: null,
      pagesBBSOld: null,
      commentsBBSOld: null,
      publicationOtherBBSOld: null,
      publicationFasciculeBBSOld: null,
      author: 4,
      reviewer: null,
      validator: 0,
      identifierType: null,
      entrance: 14,
      massif: null,
      cave: null,
      authorCaver: null,
      authorGrotto: null,
      editor: null,
      library: null,
      type: 4,
      parent: null,
      license: 1,
      authorizationDocument: null,
      option: 1
    }
  ],
  exploredEntrances: [
    {
      id: 1,
      region: 'Haute-Savoie (74), Auvergne-Rhône-Alpes (ARA)',
      county: 'Haute-Savoie',
      city: 'Samoëns',
      name: 'cavité 75070',
      address: null,
      yearDiscovery: 1963,
      externalUrl: null,
      dateInscription: '2008-07-28T15:08:37.000Z',
      dateReviewed: null,
      isPublic: true,
      isSensitive: false,
      contact: null,
      modalities: 'NO,NO,NO,NO',
      hasContributions: true,
      latitude: '46.10222000000000000000',
      longitude: '6.77962000000000000000',
      altitude: 1836,
      isOfInterest: false,
      isDeleted: false,
      precision: null,
      idDbImport: null,
      nameDbImport: null,
      author: 4,
      reviewer: null,
      cave: 75070,
      country: 'FR',
      geology: 'Q82480    '
    },
    {
      id: 2,
      region: 'Haute-Savoie (74), Auvergne-Rhône-Alpes (ARA)',
      county: 'Haute-Savoie',
      city: 'Samoëns',
      name: 'cavité 75142',
      address: null,
      yearDiscovery: 1981,
      externalUrl: null,
      dateInscription: '2008-07-28T15:10:21.000Z',
      dateReviewed: null,
      isPublic: true,
      isSensitive: false,
      contact: null,
      modalities: 'NO,NO,NO,NO',
      hasContributions: true,
      latitude: '46.11504999999990000000',
      longitude: '6.79815000000002000000',
      altitude: 2142,
      isOfInterest: true,
      isDeleted: false,
      precision: null,
      idDbImport: null,
      nameDbImport: null,
      author: 4,
      reviewer: null,
      cave: 75142,
      country: 'FR',
      geology: 'Q82480    '
    }
  ]
}; 

const testPerson = {
  '@context': 'https://ontology.uis-speleo.org/grottocenter.org_context.jsonld',
  '@id': '1',
  '@type': 'http://xmlns.com/foaf/0.1/Person',
  id: 1,
  groups: [
    {
      id: 1,
      name: 'Administrator',
      comments: 'Technical responsible of the application.'
    }
  ],
  name: 'Adrien',
  nickname: 'Admin1',
  surname: 'Admo',
  language: 'fra',
  mail: 'admin1@admin1.com',
  documents: [
    {
      id: 1,
      dateInscription: '2017-04-19T09:38:39.000Z',
      dateValidation: '2017-05-01T10:24:19.000Z',
      datePublication: null,
      dateReviewed: null,
      isValidated: true,
      issue: null,
      validationComment: null,
      authorComment: null,
      pages: null,
      identifier: null,
      refBbs: null,
      isDeleted: false,
      modifiedDocJson: null,
      idDbImport: null,
      nameDbImport: null,
      pagesBBSOld: null,
      commentsBBSOld: null,
      publicationOtherBBSOld: null,
      publicationFasciculeBBSOld: null,
      author: 1,
      reviewer: 2,
      validator: null,
      identifierType: null,
      entrance: null,
      massif: null,
      cave: null,
      authorCaver: null,
      authorGrotto: null,
      editor: null,
      library: null,
      type: 1,
      parent: null,
      license: 1,
      authorizationDocument: null,
      option: null,
      descriptions: [Array]
    },
    {
      id: 2,
      dateInscription: '2017-04-19T09:38:39.000Z',
      dateValidation: '2017-05-01T10:24:19.000Z',
      datePublication: '2010-01',
      dateReviewed: null,
      isValidated: true,
      issue: 'n°1',
      validationComment: null,
      authorComment: null,
      pages: null,
      identifier: '1234-5678',
      refBbs: null,
      isDeleted: false,
      modifiedDocJson: null,
      idDbImport: null,
      nameDbImport: null,
      pagesBBSOld: null,
      commentsBBSOld: null,
      publicationOtherBBSOld: null,
      publicationFasciculeBBSOld: null,
      author: 1,
      reviewer: 2,
      validator: null,
      identifierType: 'issn',
      entrance: null,
      massif: null,
      cave: null,
      authorCaver: null,
      authorGrotto: null,
      editor: null,
      library: null,
      type: 17,
      parent: 1,
      license: 1,
      authorizationDocument: null,
      option: null,
      descriptions: [Array]
    },
    {
      id: 4,
      dateInscription: '2018-04-19T09:38:39.000Z',
      dateValidation: '2019-11-01T11:24:19.000Z',
      datePublication: '2010-02',
      dateReviewed: null,
      isValidated: true,
      issue: null,
      validationComment: null,
      authorComment: null,
      pages: null,
      identifier: '1234-5679',
      refBbs: null,
      isDeleted: false,
      modifiedDocJson: null,
      idDbImport: null,
      nameDbImport: null,
      pagesBBSOld: null,
      commentsBBSOld: null,
      publicationOtherBBSOld: null,
      publicationFasciculeBBSOld: null,
      author: 1,
      reviewer: 2,
      validator: null,
      identifierType: 'issn',
      entrance: null,
      massif: null,
      cave: null,
      authorCaver: null,
      authorGrotto: null,
      editor: null,
      library: null,
      type: 18,
      parent: 3,
      license: 1,
      authorizationDocument: null,
      option: null,
      descriptions: [Array]
    }
  ],
  exploredEntrances: [
    {
      id: 4,
      region: null,
      county: null,
      city: null,
      address: null,
      yearDiscovery: null,
      externalUrl: null,
      dateInscription: null,
      dateReviewed: null,
      isPublic: true,
      isSensitive: false,
      contact: null,
      modalities: 'NO,NO,NO,NO',
      hasContributions: false,
      latitude: '-1.00000000000000000000',
      longitude: '-3.00000000000000000000',
      altitude: null,
      isOfInterest: false,
      isDeleted: false,
      precision: null,
      idDbImport: null,
      nameDbImport: null,
      author: 5,
      reviewer: 2,
      cave: 3,
      country: null,
      geology: null,
      names: []
    }
  ],
  organizations: [
    {
      id: 1,
      village: null,
      county: 'Hauts-de-Seine',
      region: 'Île-de-France',
      city: 'Issy-les-Moulineaux',
      postalCode: '92130',
      address: '50 rue des pétunias',
      mail: 'organization@organization.com',
      yearBirth: 1999,
      dateInscription: '2008-05-28T12:47:45.000Z',
      dateReviewed: null,
      latitude: '48.82389600000000000000',
      longitude: '2.26568199999998160000',
      customMessage: null,
      isOfficialPartner: true,
      url: 'https://organization1.com',
      isDeleted: false,
      pictureFileName: null,
      author: 1,
      reviewer: null,
      country: null,
      names: [Array],
      name: 'Organization 1'
    },
    {
      id: 2,
      village: null,
      county: 'Rhône',
      region: 'Auvergne-Rhône-Alpes',
      city: 'Lyon',
      postalCode: '69000',
      address: '6 boulevard Victor Hugo',
      mail: 'organization2@organization2.com',
      yearBirth: 1978,
      dateInscription: '2005-05-28T12:47:45.000Z',
      dateReviewed: null,
      latitude: '48.72489600000000000000',
      longitude: '2.26658199999998160000',
      customMessage: 'Hello Grottocenter :)',
      isOfficialPartner: true,
      url: 'https://organization2.fr',
      isDeleted: false,
      pictureFileName: null,
      author: 1,
      reviewer: null,
      country: 'FR',
      names: [Array],
      name: 'Organization 2'
    }
  ]
};
*/
