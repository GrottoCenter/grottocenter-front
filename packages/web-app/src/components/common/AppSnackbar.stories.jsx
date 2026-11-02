import { FormattedMessage } from 'react-intl';
import { action } from 'storybook/actions';

import AppSnackbar from './AppSnackbar';
import { createCloseAction, createRetryAction } from './snackbarActions';

const meta = {
  title: 'Common/AppSnackbar',
  component: AppSnackbar,
  args: { id: 'example-snackbar' }
};
export default meta;

export const Success = {
  args: {
    variant: 'success',
    message: <FormattedMessage id="Comment published." />
  }
};

export const RetryableWarning = {
  args: {
    variant: 'warning',
    message: (
      <FormattedMessage id="Comment published, but the entrance could not be added to your explored entrances." />
    ),
    action: createRetryAction({
      labelId: 'Retry adding',
      onRetry: () =>
        new Promise(resolve => {
          setTimeout(resolve, 1500);
        }),
      onClose: action('close notification')
    })
  }
};

export const DismissibleWarning = {
  args: {
    variant: 'warning',
    message: (
      <FormattedMessage id="Comment published, but the entrance could not be added to your explored entrances." />
    ),
    action: createCloseAction(action('close notification'))
  }
};
