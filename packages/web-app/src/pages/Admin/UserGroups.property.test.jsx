import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import fc from 'fast-check';

import UserGroups from './UserGroups';

const messages = {
  Groups: 'Groups',
  Banned: 'Banned',
  Save: 'Save',
  Reset: 'Reset',
  Administrator: 'Administrator',
  Moderator: 'Moderator',
  Leader: 'Leader',
  'Cannot ban yourself': 'Cannot ban yourself'
};

const defaultProps = {
  isLoading: false,
  onSaveGroups: vi.fn(),
  onSaveBan: vi.fn(),
  userGroups: [],
  isBanned: false,
  isSelfUser: false
};

const renderUserGroups = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <UserGroups {...defaultProps} {...props} />
    </IntlProvider>
  );

const getBanSwitch = () => screen.getByRole('switch', { name: 'Banned' });

// Changeable group IDs from GroupHelper: 1 (Administrator), 2 (Moderator), 5 (Leader)
const changeableGroupIds = [1, 2, 5];

const groupNameById = { 1: 'Administrator', 2: 'Moderator', 5: 'Leader' };

const groupsArb = fc
  .subarray(changeableGroupIds, { minLength: 0, maxLength: 3 })
  .map(ids => ids.map(id => ({ id })));

/**
 * Property 2: Ban switch reflects server ban status
 *
 * For any boolean value of isBanned passed as a prop to UserGroups,
 * the "Banned" switch's checked state should equal that isBanned value
 * on initial render.
 *
 * Encodes: the switch is a controlled component initialized from the prop.
 * Covers: both true and false isBanned values.
 *
 * Validates: Requirements 2.2, 2.3
 */
// fast-check runs many render iterations — needs more than Vitest's 5s default.
vi.setConfig({ testTimeout: 30000 });

describe('Property 2: Ban switch reflects server ban status', () => {
  it('switch checked state matches isBanned prop on initial render', () => {
    fc.assert(
      fc.property(fc.boolean(), isBanned => {
        const { unmount } = renderUserGroups({ isBanned });

        const banSwitch = getBanSwitch();
        if (isBanned) {
          expect(banSwitch).toBeChecked();
        } else {
          expect(banSwitch).not.toBeChecked();
        }

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Save button enabled on dirty state
 *
 * For any combination of initial groups, initial isBanned, current groups,
 * and current banned state, the Save button should be enabled if and only if
 * the current groups differ from the initial groups OR the current banned
 * state differs from the initial isBanned state.
 *
 * Encodes: the dirty check logic that gates the Save button.
 * Covers: all combinations of group and ban state changes.
 *
 * Validates: Requirements 2.5
 */
describe('Property 3: Save button enabled on dirty state', () => {
  it('Save button enabled iff groups or ban state differs from initial', () => {
    fc.assert(
      fc.property(
        groupsArb,
        fc.boolean(),
        groupsArb,
        fc.boolean(),
        (initialGroups, initialBanned, targetGroups, targetBanned) => {
          const onSaveGroups = vi.fn();
          const onSaveBan = vi.fn();

          const { unmount } = renderUserGroups({
            userGroups: initialGroups,
            isBanned: initialBanned,
            onSaveGroups,
            onSaveBan
          });

          // Determine which groups need toggling
          const initialIds = new Set(initialGroups.map(g => g.id));
          const targetIds = new Set(targetGroups.map(g => g.id));

          // Toggle groups that differ
          changeableGroupIds.forEach(gid => {
            const wasChecked = initialIds.has(gid);
            const shouldBeChecked = targetIds.has(gid);
            if (wasChecked !== shouldBeChecked) {
              const switchEl = screen.getByRole('switch', {
                name: groupNameById[gid]
              });
              fireEvent.click(switchEl);
            }
          });

          // Toggle ban if needed
          if (targetBanned !== initialBanned) {
            fireEvent.click(getBanSwitch());
          }

          const saveButton = screen.getByRole('button', { name: 'Save' });

          const groupsChanged =
            [...targetIds].sort().join(',') !==
            [...initialIds].sort().join(',');
          const banChanged = targetBanned !== initialBanned;
          const shouldBeEnabled = groupsChanged || banChanged;

          if (shouldBeEnabled) {
            expect(saveButton).not.toBeDisabled();
          } else {
            expect(saveButton).toBeDisabled();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: No ban API call when ban state unchanged
 *
 * For any save operation where the local ban toggle state equals the original
 * isBanned prop value, no request should be dispatched to the ban or unban API
 * endpoint, regardless of whether role group changes are being saved.
 *
 * Encodes: ban API calls are gated by dirty check — unchanged ban state skips the call.
 * Covers: random group changes with unchanged ban state.
 *
 * Validates: Requirements 2.8
 */
describe('Property 4: No ban API call when ban state unchanged', () => {
  it('onSaveBan is not called when ban state is unchanged, even with group changes', () => {
    fc.assert(
      fc.property(
        groupsArb,
        fc.boolean(),
        groupsArb,
        (initialGroups, isBanned, targetGroups) => {
          const onSaveGroups = vi.fn();
          const onSaveBan = vi.fn();

          const { unmount } = renderUserGroups({
            userGroups: initialGroups,
            isBanned,
            onSaveGroups,
            onSaveBan
          });

          // Toggle groups to reach targetGroups
          const initialIds = new Set(initialGroups.map(g => g.id));
          const targetIds = new Set(targetGroups.map(g => g.id));

          changeableGroupIds.forEach(gid => {
            const wasChecked = initialIds.has(gid);
            const shouldBeChecked = targetIds.has(gid);
            if (wasChecked !== shouldBeChecked) {
              const switchEl = screen.getByRole('switch', {
                name: groupNameById[gid]
              });
              fireEvent.click(switchEl);
            }
          });

          // Do NOT toggle ban — leave it unchanged

          const saveButton = screen.getByRole('button', { name: 'Save' });
          const groupsChanged =
            [...targetIds].sort().join(',') !==
            [...initialIds].sort().join(',');

          if (groupsChanged) {
            // Save should be enabled due to group changes
            expect(saveButton).not.toBeDisabled();
            fireEvent.click(saveButton);
            // onSaveGroups should be called, but onSaveBan must NOT
            expect(onSaveGroups).toHaveBeenCalled();
            expect(onSaveBan).not.toHaveBeenCalled();
          } else {
            // Nothing changed — Save should be disabled, no calls
            expect(saveButton).toBeDisabled();
            expect(onSaveBan).not.toHaveBeenCalled();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Self-ban prevention
 *
 * For any caver where isSelfUser is true, the "Banned" switch should be
 * rendered in a disabled state, preventing the admin from banning themselves.
 *
 * Encodes: self-ban prevention at the UI level.
 * Covers: random isBanned values with isSelfUser always true.
 *
 * Validates: Requirements 2.10
 */
describe('Property 5: Self-ban prevention', () => {
  it('switch is disabled when isSelfUser is true', () => {
    fc.assert(
      fc.property(fc.boolean(), isBanned => {
        const { unmount } = renderUserGroups({
          isBanned,
          isSelfUser: true
        });

        const banSwitch = getBanSwitch();
        expect(banSwitch).toBeDisabled();

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
