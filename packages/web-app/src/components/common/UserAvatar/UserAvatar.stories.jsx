import UserAvatar from './index';

const meta = { title: 'Common/UserAvatar', component: UserAvatar };
export default meta;

export const Default = { args: { username: 'Paul Aubertin' } };
export const SingleWord = { args: { username: 'RomainVanel' } };
export const Primary = { args: { username: 'Clément Rz', color: 'primary' } };
export const Empty = { args: { username: undefined } };
export const Large = {
  args: { username: 'Frédéric Urien', sx: { width: 56, height: 56 } }
};
