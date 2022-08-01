const getAuthor = author => ({
  id: author?.id,
  fullName: author?.nickname || author?.name || author?.surname,
  name: author?.name,
  nickname: author?.nickname,
  surname: author?.surname,
  url: author?.id ? `/ui/persons/${author?.id}` : undefined
});

export default getAuthor;
