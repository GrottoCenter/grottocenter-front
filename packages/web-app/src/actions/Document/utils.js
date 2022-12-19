import { keys } from 'ramda';

// From https://stackoverflow.com/a/42483509/16600080
// FormData can't send null values, so we omit them.
// eslint-disable-next-line import/prefer-default-export
export const buildFormData = (formData, data, parentKey) => {
  if (
    data &&
    typeof data === 'object' &&
    !(data instanceof Date) &&
    !(data instanceof File)
  ) {
    keys(data).forEach(key => {
      buildFormData(
        formData,
        data[key],
        parentKey ? `${parentKey}[${key}]` : key
      );
    });
  } else if (data || data === '') {
    formData.append(parentKey, data);
  }
};

// Merge startPage and endPage in one attribute 'pages'
export const buildPages = (startPage, endPage) => {
  let pages = null;
  // A page can be 0 so check for 'if(startPage)' only will not work.
  // That's why we use 'if(startPage === null)' here.
  if (startPage === null && endPage !== null) {
    pages = endPage;
  } else if (startPage !== null && endPage === null) {
    pages = `${startPage},`;
  } else if (startPage !== null && endPage !== null) {
    pages = `${startPage}-${endPage}`;
  }
  return pages;
};
