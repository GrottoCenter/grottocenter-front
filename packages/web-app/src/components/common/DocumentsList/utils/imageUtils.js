/**
 * Utility functions for handling image files in DocumentsList
 */

/**
 * Extract file extension from filename
 * @param {string} fileName - The name of the file
 * @returns {string} The file extension with leading dot (e.g., '.jpg') or empty string
 */
export const getFileExtension = fileName => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  const parts = fileName.split('.');
  return parts.length > 1 ? `.${parts.pop().toLowerCase()}` : '';
};

/**
 * Check if a file is an image based on its extension
 * @param {string} fileName - The name of the file
 * @returns {boolean} True if the file is an image
 */
export const isImageFile = fileName => {
  const extension = getFileExtension(fileName);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  return imageExtensions.includes(extension);
};
