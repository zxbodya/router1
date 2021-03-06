export function splitUrl(url: string): [string, string, string] {
  const urlParts = url.match(/^([^?#]*)(?:\?([^#]*))?#?(.*)$/) as [
    string,
    string,
    string,
    string
  ];
  const path = urlParts[1];
  const query = urlParts[2] || '';
  const hash = urlParts[3];
  return [path, query, hash];
}
