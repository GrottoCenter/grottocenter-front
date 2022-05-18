const makeNetworkData = data => ({
  depth: data.depth,
  id: data.id,
  isDiving: data.isDivingCave,
  length: data.length,
  name: {
    language: data.language,
    text: data.name
  },
  temperature: data.temperature
});
export default makeNetworkData;
