function arrFindReplaceOrAdd(arr, test, replacement) {
  if (!Array.isArray(arr)) return arr;
  const newArr = arr.slice(); // Create a copy for immutability
  const index = newArr.findIndex(test);
  if (index < 0) newArr.push(replacement);
  else newArr.splice(index, 1, replacement);
  return newArr;
}

export default arrFindReplaceOrAdd;
