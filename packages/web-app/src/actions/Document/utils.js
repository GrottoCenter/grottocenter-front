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
