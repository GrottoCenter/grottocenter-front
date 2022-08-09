// Remove the next line when other exports are created.
export const makeUrl = (url, criterias) => {
  if (criterias) {
    return `${url}?${Object.keys(criterias)
      .map(k => `${k}=${encodeURIComponent(criterias[k])}`)
      .join('&')}`;
  }
  return url;
};

export const checkStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response;
  }
  const errorMessage = new Error(response.statusText);
  throw errorMessage;
};
