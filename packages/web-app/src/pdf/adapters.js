import {
  PDF_SECTIONS,
  buildEntrancePdfModel,
  getPdfSectionAvailability
} from './entrance/model';
import {
  NETWORK_PDF_SECTIONS,
  buildNetworkPdfModel,
  getNetworkPdfAvailability
} from './network/model';
import {
  MASSIF_PDF_SECTIONS,
  buildMassifPdfModel,
  getMassifPdfAvailability
} from './massif/model';
import {
  TERRITORY_PDF_SECTIONS,
  buildTerritoryPdfModel,
  getTerritoryPdfAvailability
} from './territory/model';

export const PDF_ADAPTERS = {
  country: {
    sections: TERRITORY_PDF_SECTIONS,
    availability: (entity, _isAdmin, context) =>
      getTerritoryPdfAvailability(entity, context.statistics),
    build: options =>
      buildTerritoryPdfModel({ ...options, entityType: 'country' }),
    mapZoom: 4
  },
  region: {
    sections: TERRITORY_PDF_SECTIONS,
    availability: (entity, _isAdmin, context) =>
      getTerritoryPdfAvailability(entity, context.statistics),
    build: options =>
      buildTerritoryPdfModel({ ...options, entityType: 'region' }),
    mapZoom: 6
  },
  entrance: {
    sections: PDF_SECTIONS,
    availability: getPdfSectionAvailability,
    build: options =>
      buildEntrancePdfModel({ ...options, entrance: options.entity })
  },
  network: {
    sections: NETWORK_PDF_SECTIONS,
    availability: getNetworkPdfAvailability,
    build: buildNetworkPdfModel
  },
  massif: {
    sections: MASSIF_PDF_SECTIONS,
    availability: (entity, isAdmin, context) =>
      getMassifPdfAvailability(entity, isAdmin, context.statistics),
    build: buildMassifPdfModel
  }
};
