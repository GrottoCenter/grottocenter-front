import { pathOr, is, isNil } from 'ramda';
import { useIntl } from 'react-intl';

/**
 * This function is called on every input. It defines what is shown to the user.
 * The default value is '', it is returned if the value is null or undefined, or the specific pach is undefined.
 *
 * This function was necessary to handle a specific use case : if we have one attribute of a duplicate which is on object from the database,
 * whereas the same attribute from the other duplicate is a simple string.
 *
 * @param {Array} specificPath : the path on the object to reach the desired value. Example ['author', 'name'].
 * @returns a function which takes the value as a parameter, and returned the value which must be shown to the user.
 */
const customRender = specificPath => {
  let func = value => value;
  if (specificPath) {
    func = value => {
      const returnedValue = pathOr(value, specificPath, value);
      if (is(String, returnedValue)) {
        return returnedValue;
      }
      return '';
    };
  }

  return value => {
    if (isNil(value)) {
      return '';
    }
    return func(value);
  };
};

export const getEntranceSchema = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { formatMessage } = useIntl();
  return [
    {
      attribute: 'author',
      label: formatMessage({ id: 'Entrance creator id' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'reviewer',
      label: formatMessage({ id: 'Reviewer' }),
      disabled: true,
      customRender: customRender()
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
      attribute: 'address',
      label: formatMessage({ id: 'Address' }),
      customRender: customRender()
    },
    {
      attribute: 'yearDiscovery',
      label: formatMessage({ id: 'Year of discovery' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'dateInscription',
      label: formatMessage({ id: 'Inscription Date' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'dateReviewed',
      label: formatMessage({ id: 'Date reviewed' }),
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
      attribute: 'geology',
      label: formatMessage({ id: 'Geology' }),
      disabled: true,
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
      attribute: 'documents',
      label: formatMessage({ id: 'Documents id' }),
      customRender: customRender(['id']),
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
      customRender: customRender(['nickname']),
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
      customRender: customRender()
    },
    {
      attribute: 'identifier',
      label: formatMessage({ id: 'Identifier' }),
      customRender: customRender()
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
      customRender: customRender()
    },
    {
      attribute: 'entrance',
      label: formatMessage({ id: 'Entrance' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'massif',
      label: formatMessage({ id: 'Massif' }),
      disabled: true,
      customRender: customRender()
    },
    {
      attribute: 'cave',
      label: formatMessage({ id: 'Cave' }),
      disabled: true,
      customRender: customRender()
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
      attribute: 'type',
      label: formatMessage({ id: 'Type' }),
      customRender: customRender(['name']),
      disabled: true
    },
    {
      attribute: 'parent',
      label: formatMessage({ id: 'Document parent' }),
      customRender: customRender(['descriptions']),
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
      attribute: 'regions',
      label: formatMessage({ id: 'Regions' }),
      customRender: customRender(['name']),
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
      attribute: 'descriptions',
      label: formatMessage({ id: 'Descriptions' }),
      customRender: value =>
        `${customRender(['body'])(value)} ${customRender(['language', 'part1'])(
          value
        )}`,
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
