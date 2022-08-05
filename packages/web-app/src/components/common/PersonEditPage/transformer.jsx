const makeUserData = data => ({
  name: data.user.name,
  surname: data.user.surname,
  nickname: data.user.nickname
});
export default makeUserData;
