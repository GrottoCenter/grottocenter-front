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

export const PDF_ADAPTERS = {
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
