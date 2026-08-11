import { useIntl } from 'react-intl';
import PWAPrompt from 'react-ios-pwa-prompt';

// iOS-only counterpart to the Play Store banner: Safari has no
// beforeinstallprompt event, so the only way to install the PWA is via
// Share -> Add to Home Screen. The library self-gates on iOS + non-standalone
// and throttles reappearance via localStorage.
const IosInstallPrompt = () => {
  const { formatMessage } = useIntl();

  return (
    <PWAPrompt
      appIconPath="/apple-touch-icon.png"
      copyTitle={formatMessage({ id: 'Add Grottocenter to your Home Screen' })}
      copyDescription={formatMessage({
        id: 'Install Grottocenter to browse caves offline and in fullscreen, right in the field.'
      })}
      copySubtitle="grottocenter.org"
      copyShareStep={formatMessage({
        id: "Tap the 'Share' button in the toolbar below"
      })}
      copyAddToHomeScreenStep={formatMessage({
        id: "Tap 'Add to Home Screen'"
      })}
      promptOnVisit={1}
      timesToShow={2}
    />
  );
};

export default IosInstallPrompt;
