module.exports.convertFromObjectIdToTimestamp = (objectId) => {
  return parseInt(objectId.substring(0, 8), 16);
}