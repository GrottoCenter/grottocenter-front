import PropTypes from 'prop-types';

export const PdfReferenceType = PropTypes.shape({
  title: PropTypes.string,
  bibliography: PropTypes.string,
  authors: PropTypes.string,
  credit: PropTypes.string,
  license: PropTypes.string,
  source: PropTypes.string.isRequired,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      fileName: PropTypes.string.isRequired,
      isPdf: PropTypes.bool.isRequired,
      firstPage: PropTypes.number,
      lastPage: PropTypes.number
    })
  )
});

export const PdfContributionType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string,
  body: PropTypes.string,
  source: PropTypes.string,
  metadata: PropTypes.string,
  details: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      icon: PropTypes.string
    })
  ),
  obstacles: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string))
});

export const PdfBlockType = PropTypes.shape({
  key: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['contributions', 'rigging', 'links']).isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PdfContributionType).isRequired
});

export const PdfModelType = PropTypes.shape({
  entityType: PropTypes.oneOf([
    'entrance',
    'network',
    'massif',
    'country',
    'region'
  ]).isRequired,
  propertiesTitle: PropTypes.string.isRequired,
  brand: PropTypes.shape({
    colors: PropTypes.objectOf(PropTypes.string),
    icons: PropTypes.objectOf(PropTypes.shape({})),
    logo: PropTypes.shape({})
  }),
  title: PropTypes.string.isRequired,
  source: PropTypes.string.isRequired,
  generatedAt: PropTypes.string.isRequired,
  metadata: PropTypes.string,
  warning: PropTypes.string,
  labels: PropTypes.objectOf(PropTypes.string).isRequired,
  legends: PropTypes.string,
  properties: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      tone: PropTypes.oneOf(['good', 'satisfactory', 'insufficient'])
    })
  ).isRequired,
  map: PropTypes.shape({
    image: PropTypes.instanceOf(Uint8Array).isRequired,
    attribution: PropTypes.string.isRequired,
    source: PropTypes.string.isRequired
  }),
  blocks: PropTypes.arrayOf(PdfBlockType).isRequired,
  references: PropTypes.arrayOf(PdfReferenceType).isRequired,
  nativeAnnexes: PropTypes.arrayOf(PdfReferenceType),
  inlineDocuments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
      credit: PropTypes.string,
      files: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string.isRequired,
          url: PropTypes.string.isRequired,
          image: PropTypes.instanceOf(Uint8Array)
        })
      ).isRequired
    })
  )
});
