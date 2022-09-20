import formatNotification from '../../components/appli/NotificationMenu/formatNotification';

const makeNotifications = notifications => {
  if (!notifications) return [];
  return notifications.map(n => {
    const {
      dateInscription,
      entityName,
      entityType,
      iconPath,
      isRead,
      link,
      notifier,
      verb
    } = formatNotification(n);
    return {
      // Manage columns order
      id: n.id,
      dateInscription,
      entityName,
      entityType,
      action: verb,
      iconPath,
      notifier,
      isRead,
      link
    };
  });
};

export default makeNotifications;
