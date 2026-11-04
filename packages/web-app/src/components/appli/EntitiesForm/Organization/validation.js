import { isValidEmail } from '@/conf/config';

export const validateOrganizationName = (value, formatMessage) =>
  !!value?.trim() || formatMessage({ id: 'Required' });

export const validateOrganizationEmail = (value, formatMessage) =>
  !value ||
  isValidEmail(value) ||
  formatMessage({ id: 'The email must be valid.' });

export const validateOrganizationUrl = (value, formatMessage) => {
  if (!value) return true;
  try {
    return Boolean(new URL(value));
  } catch {
    return formatMessage({ id: 'The URL must be valid.' });
  }
};
