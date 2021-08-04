import { useIntl } from 'react-intl';

const useMakeCustomHeaderCellRenders = () => {
  const { formatMessage } = useIntl();

  return [
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
    }
  ];
};

export default useMakeCustomHeaderCellRenders;
