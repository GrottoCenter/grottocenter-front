const getAuthor = author => ({
  id: author?.id,
  fullName: author?.nickname || author?.name || author?.surname,
  name: author?.name,
  nickname: author?.nickname,
  surname: author?.surname,
  url: `/ui/persons/${author?.id}`
});

export default getAuthor;
