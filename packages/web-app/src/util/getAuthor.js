const getAuthor = author => {
  if (!author?.id) return undefined;

  return {
    id: author?.id,
    nickname: author?.nickname,
    url: author?.id ? `/ui/persons/${author?.id}` : undefined
  };
};

export default getAuthor;
