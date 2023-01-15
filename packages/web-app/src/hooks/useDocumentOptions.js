import { useIntl } from 'react-intl';

export const AUTHORIZATION_FROM_AUTHOR = 'Author created this document';
export const LICENSE_IN_FILE = 'License in files';
export const DOCUMENT_AUTHORIZE_TO_PUBLISH =
  'Authorization present in GrottoCenter';

// This hook allows us to use the content of t_option table without needing to create translation in the table.
export const useDocumentOptions = () => {
  const { formatMessage } = useIntl();

  return [
    {
      idDb: 1,
      value: AUTHORIZATION_FROM_AUTHOR,
      translatedOption: formatMessage({ id: AUTHORIZATION_FROM_AUTHOR }),
      translatedToUser: formatMessage({
        id: 'You are the author of this document'
      })
    },
    {
      idDb: 2,
      value: LICENSE_IN_FILE,
      translatedOption: formatMessage({ id: LICENSE_IN_FILE }),
      translatedToUser: formatMessage({
        id: 'The license is written in the files'
      })
    },
    {
      idDb: 3,
      value: DOCUMENT_AUTHORIZE_TO_PUBLISH,
      translatedOption: formatMessage({ id: DOCUMENT_AUTHORIZE_TO_PUBLISH }),
      translatedToUser: formatMessage({
        id: 'There is an authorization to publish from the author on GrottoCenter'
      })
    }
  ];
};
