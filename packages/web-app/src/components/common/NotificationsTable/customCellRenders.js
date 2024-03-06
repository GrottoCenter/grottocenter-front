import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import DoneIcon from '@mui/icons-material/Done';
import UnreadNotificationIcon from '@mui/icons-material/FiberManualRecord';
import { useIntl } from 'react-intl';
import { Tooltip } from '@mui/material';
import GCLink from '../GCLink';

const useMakeCustomCellRenders = () => {
  const { formatDate, formatMessage, formatTime } = useIntl();

  return [
    {
      id: 'dateInscription',
      customRender: date =>
        date
          ? `${formatDate(new Date(date))} ${formatTime(new Date(date))}`
          : null
    },
    {
      id: 'isRead',
      customRender: isRead =>
        isRead ? (
          <CheckIcon color="primary" fontSize="small" />
        ) : (
          <UnreadNotificationIcon color="secondary" fontSize="small" />
        )
    },
    {
      id: 'iconPath',
      customRender: iconPath => (
        <img src={iconPath} alt="icon" style={{ width: '24px' }} />
      )
    },
    {
      id: 'notifier',
      customRender: notifier => (
        <GCLink href={`/ui/persones/${notifier.id}`}>
          {notifier.nickname}
        </GCLink>
      )
    },
    {
      id: 'action',
      customRender: action => {
        let content;
        switch (action) {
          case 'created':
            content = <AddIcon color="primary" />;
            break;
          case 'deleted':
            content = <ClearIcon color="primary" />;
            break;
          case 'updated':
            content = <EditIcon color="primary" />;
            break;
          case 'validated':
            content = <DoneIcon color="primary" />;
            break;
          default:
            content = action;
        }
        return (
          <Tooltip title={formatMessage({ id: action })}>{content}</Tooltip>
        );
      }
    }
  ];
};

export default useMakeCustomCellRenders;
