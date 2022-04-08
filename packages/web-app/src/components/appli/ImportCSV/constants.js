// Type of the imported csv
export const ENTRANCE = 0;
export const DOCUMENT = 1;

export const ENTRANCE_KARSTLINK = 'karstlink:UndergroundCavity';
export const DOCUMENT_KARSTLINK = 'dct:BibliographicResource';

// Name of the downloaded files after import
export const SUCCESS_IMPORT = 'importGCsuccess';
export const FAILURE_IMPORT = 'importGCfailure';

// Common columns from karstlink
export const ALTERNATE_NAME = 'gn:alternateName';
export const ATTRIBUTION_NAME = 'dct:rights/cc:attributionName';
export const ATTRIBUTION_URL = 'dct:rights/cc:attributionURL';
export const CREATION_DATE = 'dct:rights/dct:created';
export const DESCRIPTION_DOCUMENT =
  'karstlink:hasDescriptionDocument/dct:description';
export const DESCRIPTION_DOCUMENT_CREATOR =
  'karstlink:hasDescriptionDocument/dct:creator';
export const DESCRIPTION_DOCUMENT_LANGUAGE =
  'karstlink:hasDescriptionDocument/dc:language';
export const DESCRIPTION_DOCUMENT_TITLE =
  'karstlink:hasDescriptionDocument/dct:title';
export const ID = 'id';
export const LABEL = 'rdfs:label';
export const LABEL_LANGUAGE = 'rdfs:label/dc:language';
export const LICENSE = 'dct:rights/karstlink:licenseType';
export const MODIFICATION_DATE = 'dct:rights/dct:modified';
export const TYPE = 'rdf:type';

// Entrances columns from karstlink
export const ALTITUDE = 'w3geo:altitude';
export const CONTAINED_IN_PLACE = 'schema:containedInPlace';
export const COUNTRY_CODE = 'gn:countryCode';
export const DESCRIPTION_LOCATION =
  'karstlink:hasAccessDocument/dct:description';
export const DESCRIPTION_LOCATION_CREATOR =
  'karstlink:hasAccessDocument/dct:creator';
export const DESCRIPTION_LOCATION_LANGUAGE =
  'karstlink:hasAccessDocument/dc:language';
export const DESCRIPTION_LOCATION_TITLE =
  'karstlink:hasAccessDocument/dct:title';
export const DISCOVERED_BY = 'karstlink:discoveredBy';
export const EXTEND_ABOVE = 'karstlink:extendAboveEntrance';
export const EXTEND_BELOW = 'karstlink:extendBelowEntrance';
export const LATITUDE = 'w3geo:latitude';
export const LENGTH = 'karstlink:length';
export const LONGITUDE = 'w3geo:longitude';
export const PRECISION = 'dwc:coordinatePrecision';
export const VERTICAL_EXTEND = 'karstlink:verticalExtend';

// Documents columns from karstlink
export const CREATOR = 'dct:creator';
export const DATE = 'dct:date';
export const DOCUMENT_TYPE = 'karstlink:documentType';
export const FORMAT = 'dct:format';
export const IDENTIFIER = 'dct:identifier';
export const IS_PART_OF = 'dct:isPartOf';
export const LANGUAGE = 'dc:language';
export const PUBLISHER = 'dct:publisher';
export const REFERENCES = 'dct:references';
export const SOURCE = 'dct:source';
export const SUBJECT = 'dct:subject';
export const UNDERGROUND = 'karstlink:relatedToUndergroundCavity';
