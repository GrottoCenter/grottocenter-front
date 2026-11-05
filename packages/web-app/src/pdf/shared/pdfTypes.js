import PropTypes from 'prop-types';

export const PdfReferenceType = PropTypes.shape({
  code: PropTypes.string,
  title: PropTypes.string,
  reference: PropTypes.string,
  bibliography: PropTypes.string,
  authors: PropTypes.string,
  license: PropTypes.string,
  date: PropTypes.string,
  source: PropTypes.string.isRequired,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      fileName: PropTypes.string.isRequired,
      isPdf: PropTypes.bool.isRequired,
      pages: PropTypes.string
    })
  )
});

export const PdfContributionType = PropTypes.shape({
  id: PropTypes.number,
  title: PropTypes.string,
  body: PropTypes.string,
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
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PdfContributionType).isRequired
});

export const PdfModelType = PropTypes.shape({
  entityType: PropTypes.oneOf(['entrance', 'network', 'massif']).isRequired,
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
  inlineDocuments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      source: PropTypes.string.isRequired,
      files: PropTypes.arrayOf(
        PropTypes.shape({
          key: PropTypes.string.isRequired,
          url: PropTypes.string.isRequired,
          image: PropTypes.instanceOf(Uint8Array)
        })
      ).isRequired
    })
  ),
  annexes: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      fileName: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired
    })
  ).isRequired
});
