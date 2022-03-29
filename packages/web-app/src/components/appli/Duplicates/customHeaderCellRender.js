import { useIntl } from 'react-intl';

const useMakeCustomHeaderCellRenders = () => {
  const { formatMessage } = useIntl();

  return [
    {
      id: 'id',
      customRender: () => formatMessage({ id: 'Identification' })
    },
    {
      id: 'author',
      customRender: () => formatMessage({ id: 'Created by' })
    },
    {
      id: 'entrance',
      customRender: () => formatMessage({ id: 'Entrance' })
    },
    {
      id: 'document',
      customRender: () => formatMessage({ id: 'Document' })
    },
    {
      id: 'date',
      customRender: () => formatMessage({ id: 'Date' })
    },
    {
      id: 'content',
      customRender: () => formatMessage({ id: 'Preview' })
    }
  ];
};

export default useMakeCustomHeaderCellRenders;
