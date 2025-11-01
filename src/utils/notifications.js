// Notification utility functions
import toast from 'react-hot-toast';

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show browser notification
 */
export const showBrowserNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
};

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  EXPENSE_SUBMITTED: 'expense_submitted',
  EXPENSE_APPROVED: 'expense_approved',
  EXPENSE_REJECTED: 'expense_rejected',
  DEBT_ADDED: 'debt_added',
  DEBT_PAYMENT: 'debt_payment',
  BUDGET_ALERT: 'budget_alert',
  COMMENT_ADDED: 'comment_added',
  MEMBER_JOINED: 'member_joined'
};

/**
 * Send notification based on type
 */
export const sendNotification = (type, data) => {
  let title, body, toastType = 'success';

  switch (type) {
    case NOTIFICATION_TYPES.EXPENSE_SUBMITTED:
      title = 'New Expense Submitted';
      body = `${data.memberName} submitted an expense for ৳${data.amount}`;
      break;
    case NOTIFICATION_TYPES.EXPENSE_APPROVED:
      title = 'Expense Approved';
      body = `Your expense for ৳${data.amount} has been approved`;
      break;
    case NOTIFICATION_TYPES.EXPENSE_REJECTED:
      title = 'Expense Rejected';
      body = `Your expense for ৳${data.amount} has been rejected`;
      toastType = 'error';
      break;
    case NOTIFICATION_TYPES.DEBT_ADDED:
      title = 'New Debt Added';
      body = `You owe ৳${data.amount} to ${data.creditorName}`;
      toastType = 'default';
      break;
    case NOTIFICATION_TYPES.DEBT_PAYMENT:
      title = 'Payment Received';
      body = `${data.debtorName} paid ৳${data.amount}`;
      break;
    case NOTIFICATION_TYPES.BUDGET_ALERT:
      title = 'Budget Alert';
      body = data.message;
      toastType = 'error';
      break;
    case NOTIFICATION_TYPES.COMMENT_ADDED:
      title = 'New Comment';
      body = `${data.memberName} commented on an expense`;
      break;
    case NOTIFICATION_TYPES.MEMBER_JOINED:
      title = 'New Member';
      body = `${data.memberName} joined the household`;
      break;
    default:
      return;
  }

  // Show toast notification
  toast[toastType](body, {
    duration: 4000,
    position: 'top-right'
  });

  // Show browser notification if permitted
  showBrowserNotification(title, { body, tag: type });
};

