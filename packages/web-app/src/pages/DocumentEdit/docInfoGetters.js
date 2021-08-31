import { head, omit, pathOr, pipe, propOr } from 'ramda';
import {
  IS_DELETED,
  IS_INTACT,
  IS_MODIFIED
} from '../../components/common/AddFileForm/FileHelpers';

const docInfoGetters = {
  getAndConvertParentDocument: fullDocument => {
    const parent = pathOr(null, ['parent'], fullDocument);
    if (parent) {
      return {
        // Convert parent "type" to "documentType" and get name from "titles"
        documentType: {
          id: propOr(null, 'type', parent)
        },
        name: pipe(
          propOr([], ['titles']),
          head,
          propOr(null, ['text'])
        )(parent),
        ...omit(['type', 'titles'], parent)
      };
    }
    return parent;
  },

  getStartPage: fullDocument => {
    const { pages } = fullDocument;
    if (!pages) {
      return null;
    }
    const result = pages.split(/[-,]/)[0];
    if (result === '') {
      return null;
    }
    return Number(result);
  },

  getEndPage: fullDocument => {
    const { pages } = fullDocument;
    if (!pages) {
      return null;
    }
    const result = pages.split(/[-,]/)[1];
    if (result === '' || !result) {
      return null;
    }
    return Number(result);
  },

  getFiles: fullDocument => {
    const {
      files = [],
      newFiles = [],
      modifiedFiles = [],
      deletedFiles = []
    } = fullDocument;

    const getNameAndExtension = fileName => {
      const splitName = fileName.split('.');
      return {
        name: splitName[0],
        extension: splitName[1]
      };
    };

    // IS_NEW state corresponds to a file that has just been added and need to be created in the db
    // So we don't use it for those which are already created.
    const newWithState = newFiles.map(file => ({
      ...file,
      ...getNameAndExtension(file.fileName),
      state: IS_INTACT
    }));
    const modifiedWithState = modifiedFiles.map(file => ({
      ...file,
      ...getNameAndExtension(file.fileName),
      state: IS_MODIFIED
    }));
    const deletedWithState = deletedFiles.map(file => ({
      ...file,
      ...getNameAndExtension(file.fileName),
      state: IS_DELETED
    }));

    const intactWithState = files.map(file => ({
      ...file,
      ...getNameAndExtension(file.fileName),
      state: IS_INTACT
    }));
    return intactWithState.concat(
      newWithState,
      modifiedWithState,
      deletedWithState
    );
  }
};

export default docInfoGetters;
