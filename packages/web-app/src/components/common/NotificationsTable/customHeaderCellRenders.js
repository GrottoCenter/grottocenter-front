import { useIntl } from 'react-intl';

const useMakeCustomHeaderCellRenders = () => {
  const { formatMessage } = useIntl();

  return [
    {
      id: 'dateInscription',
      customRender: () => formatMessage({ id: 'Creation date' })
    },
    { id: 'entityName', customRender: () => formatMessage({ id: 'Entity' }) },
    { id: 'entityType', customRender: () => formatMessage({ id: 'Type' }) },
    { id: 'iconPath', customRender: () => formatMessage({ id: 'Related to' }) },
    { id: 'isRead', customRender: () => formatMessage({ id: 'Read?' }) },
    { id: 'notifier', customRender: () => formatMessage({ id: 'By' }) }
  ];
};

export default useMakeCustomHeaderCellRenders;
