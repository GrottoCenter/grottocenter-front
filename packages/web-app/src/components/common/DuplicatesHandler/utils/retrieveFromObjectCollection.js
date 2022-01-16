/**
 * If an js object has an id, then it comes from the db, else it comes from an imported duplicate not yet created in the db.
 * Useful to split them so they can be processed differently (the former needs only to be associated with the entity, the latter needs to be created first).
 * @param {*} collection an array of js object
 * @returns js object which contains 2 array attributes (previousItem, which are those already in the db, and newItem)
 */
export const retrieveFromObjectCollection = (collection, idLabel = 'id') => {
  return {
    newItems: collection.filter(item => item[idLabel] === undefined),
    previousItems: collection
      .filter(item => item[idLabel] !== undefined)
      .map(item => item[idLabel])
  };
};

export const getIdOrUndefined = data => {
  return data === '' ? undefined : data.id;
};
