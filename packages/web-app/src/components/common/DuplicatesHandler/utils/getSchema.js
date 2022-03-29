import { pathOr, is, isNil } from 'ramda';
import { useIntl } from 'react-intl';

/**
 * This function is called on every input. It defines what is shown to the user.
 * The default value is '', it is returned if the value is null or undefined, or the specific path is undefined.
 *
 * This function was necessary to handle a specific use case: if one attribute of a duplicate is an object from the database,
 * whereas the same attribute from the other duplicate is a simple string.
 *
 * @param {Array} specificPath : the path to the object to reach the desired value. Example ['author', 'name'].
 * @returns a function which takes the value as a parameter and returns the value which must be shown to the user.
 */
const customRender = specificPath => {
  let func = value => value;
  if (specificPath) {
    func = value => {
      const returnedValue = pathOr(value, specificPath, value);
      return is(String, returnedValue) || is(Number, returnedValue)
        ? returnedValue
        : '';
    };
  }

  return value => (isNil(value) ? '' : func(value));
};

export const getEntranceSchema = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { formatMessage } = useIntl();
  return [
    {
      attribute: 'author',
      label: formatMessage({ id: 'Entrance creator' }),
      disabled: true,
      customRender: customRender(['nickname'])
    },
    {
      attribute: 'country',
      label: formatMessage({ id: 'Country' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'region',
      label: formatMessage({ id: 'Region' }),
      customRender: customRender()
    },
    {
      attribute: 'county',
      label: formatMessage({ id: 'County' }),
      customRender: customRender()
    },
    {
      attribute: 'city',
      label: formatMessage({ id: 'City' }),
      customRender: customRender()
    },
    {
      attribute: 'discoveryYear',
      label: formatMessage({ id: 'Year of discovery' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'latitude',
      label: formatMessage({ id: 'Latitude' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'longitude',
      label: formatMessage({ id: 'Longitude' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'altitude',
      label: formatMessage({ id: 'Altitude' }),
      customRender: customRender()
    },
    {
      attribute: 'precision',
      label: formatMessage({ id: 'Precision' }),
      customRender: customRender()
    },
    {
      attribute: 'cave',
      label: formatMessage({ id: 'Cave id' }),
      customRender: customRender(['id']),
      disabled: true
    },
    {
      attribute: 'names',
      label: formatMessage({ id: 'Names' }),
      customRender: customRender(['name']),
      disabled: true,
      isCollection: true
    },
    {
      attribute: 'descriptions',
      label: formatMessage({ id: 'Descriptions' }),
      customRender: customRender(['body']),
      disabled: true,
      isCollection: true
    },
    {
      attribute: 'locations',
      label: formatMessage({ id: 'Locations' }),
      disabled: true,
      customRender: customRender(['body']),
      isCollection: true
    },
    {
      attribute: 'riggings',
      label: formatMessage({ id: 'Riggings' }),
      customRender: customRender(['title']),
      disabled: true,
      isCollection: true
    },
    {
      attribute: 'comments',
      label: formatMessage({ id: 'Comments' }),
      customRender: customRender(['title']),
      disabled: true,
      isCollection: true
    }
  ];
};

export const getDocumentSchema = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { formatMessage } = useIntl();
  return [
    {
      attribute: 'author',
      label: formatMessage({ id: 'Document creator id' }),
      customRender: customRender(['nickname']),
      disabled: true
    },
    {
      attribute: 'reviewer',
      label: formatMessage({ id: 'Reviewer' }),
      customRender: value =>
        `${customRender(['name'])(value)} ${customRender(['surname'])(value)}`,
      disabled: true
    },
    {
      attribute: 'dateInscription',
      label: formatMessage({ id: 'Inscription date' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'datePublication',
      label: formatMessage({ id: 'Publication date' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'dateReviewed',
      label: formatMessage({ id: 'Review date' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'authorComment',
      label: formatMessage({ id: 'Author comment' }),
      customRender: customRender(),
      disabled: false
    },
    {
      attribute: 'identifier',
      label: formatMessage({ id: 'Identifier' }),
      customRender: customRender(),
      disabled: false
    },
    {
      attribute: 'identifierType',
      label: formatMessage({ id: 'Identifier type' }),
      disabled: true,
      customRender: customRender(['code'])
    },
    {
      attribute: 'refBbs',
      label: formatMessage({ id: 'BBS Reference' }),
      customRender: customRender(),
      disabled: true
    },
    {
      attribute: 'entrance',
      label: formatMessage({ id: 'Entrance' }),
      disabled: true,
      customRender: customRender(['name'])
    },
    {
      attribute: 'massif',
      label: formatMessage({ id: 'Massif' }),
      disabled: true,
      customRender: customRender(['name'])
    },
    {
      attribute: 'cave',
      label: formatMessage({ id: 'Cave' }),
      disabled: true,
      customRender: customRender(['name'])
    },
    {
      attribute: 'editor',
      label: formatMessage({ id: 'Editor' }),
      customRender: customRender(['name']),
      disabled: true
    },
    {
      attribute: 'library',
      label: formatMessage({ id: 'Library' }),
      customRender: customRender(['name']),
      disabled: true
    },
    {
      attribute: 'pages',
      label: formatMessage({ id: 'Pages' }),
      customRender: customRender(),
      disabled: true
    },
    {
      attribute: 'type',
      label: formatMessage({ id: 'Type' }),
      customRender: customRender(['name']),
      disabled: true
    },
    {
      attribute: 'parent',
      label: formatMessage({ id: 'Document parent' }),
      customRender: value => {
        // We render the first title found
        const firstTitleObj = customRender(['titles'])(value)[0];
        const language = firstTitleObj.language.part1 || '';
        const title = firstTitleObj.text || '';
        return `${language} : ${title}`;
      },
      disabled: true
    },
    {
      attribute: 'license',
      label: formatMessage({ id: 'License' }),
      customRender: customRender(['name']),
      disabled: true
    },
    {
      attribute: 'authors',
      label: formatMessage({ id: 'Authors' }),
      customRender: customRender(['nickname']),
      disabled: true,
      isCollection: true
    },
    {
      attribute: 'subjects',
      label: formatMessage({ id: 'Subjects' }),
      customRender: customRender(['subject']),
      disabled: true,
      isCollection: true
    },
    {
      attribute: 'intactDescriptions',
      label: formatMessage({ id: 'Descriptions' }),
      customRender: value =>
        `${customRender(['title'])(value)} : ${customRender(['body'])(value)}`,
      disabled: true,
      isCollection: true
    },
    {
      attribute: 'languages',
      label: formatMessage({ id: 'Languages' }),
      customRender: customRender(['part1']),
      disabled: true,
      isCollection: true
    }
  ];
};
