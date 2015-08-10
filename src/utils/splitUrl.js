export default function (url) {
  let urlParts = url.match(/^([^?#]*)(?:\?([^#]*))?#?(.*)$/);

  let path = urlParts[1];
  let query = urlParts[2];
  let hash = urlParts[3];
  return [path, query, hash];
};
