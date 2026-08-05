// From https://stackoverflow.com/a/42483509/16600080
// FormData can't send null values, so we omit them.
// An empty array can't be represented either: omitting the key is read by the API
// as "leave this collection untouched". The literal string '[]' is the agreed
// sentinel meaning "clear this collection" (see config/constants/document.js and
// DocumentService.getConvertedDataFromClient in grottocenter-api).
export const buildFormData = (formData, data, parentKey) => {
  if (parentKey && Array.isArray(data) && data.length === 0) {
    formData.append(parentKey, '[]');
  } else if (
    data &&
    typeof data === 'object' &&
    !(data instanceof Date) &&
    !(data instanceof File)
  ) {
    Object.keys(data).forEach(key => {
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
