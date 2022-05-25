const makeUserData = data => ({
  id: data.user.id,
  name: data.user.name,
  surname: data.user.surname,
  nickname: data.user.nickname
});
export default makeUserData;
