import DuplicateScanControls from './DuplicateScanControls';

export default {
  title: 'Common/DuplicateScanControls',
  component: DuplicateScanControls,
  args: {
    isLoading: false,
    hasStarted: false,
    hasCompleted: false,
    progress: { loaded: 0, total: 0 },
    progressMessageId: 'Organizations scanned: {loaded} of {total}',
    isOnline: true,
    hasIgnored: false,
    onAnalyze: () => {},
    onCancel: () => {},
    onShowIgnored: () => {}
  }
};
export const Initial = {};
export const Loading = {
  args: {
    isLoading: true,
    hasStarted: true,
    progress: { loaded: 100, total: 250 }
  }
};
export const Cancelled = { args: { hasStarted: true } };
export const Error = { args: { hasStarted: true, error: { status: 500 } } };
