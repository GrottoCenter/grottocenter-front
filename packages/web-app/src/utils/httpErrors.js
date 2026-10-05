export const isClientError = error =>
  error?.status >= 400 && error?.status < 500;
