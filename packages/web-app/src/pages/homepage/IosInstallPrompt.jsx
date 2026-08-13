import { useIntl } from 'react-intl';
import PWAPrompt from 'react-ios-pwa-prompt';

// iOS-only counterpart to the Play Store banner: Safari has no
// beforeinstallprompt event, so the only way to install the PWA is via
// Share -> Add to Home Screen. The library self-gates on iOS + non-standalone
// and throttles reappearance via localStorage.
//
// Note there is deliberately no platform check here: PWAPrompt is rendered
// unconditionally and decides internally whether to show anything. It still
// mounts and reads localStorage on every platform, which is cheap enough not
// to be worth a second gate — the iOS check is inside the library, not missing.
const IosInstallPrompt = () => {
  const { formatMessage } = useIntl();

  return (
    <PWAPrompt
      appIconPath="/apple-touch-icon.png"
      copyTitle={formatMessage({ id: 'Add Grottocenter to your Home Screen' })}
      copyDescription={formatMessage({
        id: 'Install Grottocenter to browse caves offline and in fullscreen, right in the field.'
      })}
      // Not translated on purpose: this is the site's domain, not UI copy.
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
