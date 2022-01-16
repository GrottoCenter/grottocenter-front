import { propOr } from 'ramda';
import { useIntl } from 'react-intl';

const useMakeCustomCellRenders = () => {
  const { formatDate, formatTime } = useIntl();
  return [
    {
      id: 'author',
      customRender: propOr('', 'nickname')
    },
    {
      id: 'date',
      customRender: date =>
        date
          ? `${formatDate(new Date(date))} ${formatTime(new Date(date))}`
          : null
    },
    {
      id: 'content',
      customRender: content => JSON.stringify(content)
    }
  ];
};

export default useMakeCustomCellRenders;
