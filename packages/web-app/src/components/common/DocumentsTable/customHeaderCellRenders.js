import { useIntl } from 'react-intl';

const useMakeCustomHeaderCellRenders = () => {
  const { formatMessage } = useIntl();

  return [
    {
      id: 'modifiedDocJson',
      customRender: () => ''
    },
    {
      id: 'titles',
      customRender: () => formatMessage({ id: 'Title' })
    },
    {
      id: 'descriptions',
      customRender: () => formatMessage({ id: 'Description' })
    },
    {
      id: 'dateInscription',
      customRender: () => formatMessage({ id: 'Submission date' })
    },
    {
      id: 'examinator',
      customRender: () => formatMessage({ id: 'Moderator' })
    },
    {
      id: 'isValidated',
      customRender: () => formatMessage({ id: 'Is validated' })
    },
    {
      id: 'authorizationDocument',
      customRender: () => formatMessage({ id: 'Authorization document' })
    }
  ];
};

export default useMakeCustomHeaderCellRenders;
