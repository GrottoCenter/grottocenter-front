import React from 'react';
import CheckIcon from '@material-ui/icons/Check';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import UnreadNotificationIcon from '@material-ui/icons/FiberManualRecord';
import { useIntl } from 'react-intl';
import { Tooltip } from '@material-ui/core';
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
