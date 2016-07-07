export function pickValues(data, keys) {
  const res = {};
  keys.forEach(name => {
    res[name] = (data[name] === undefined) ? false : data[name];
  });
  return res;
}

export function parse(query, keys = null) {
  const data = {};
  query.split('&')
    .forEach(part => {
      if (part === '') return;
      const parts = part.split('=');
      const name = decodeURIComponent(parts[0]);
      const rawValue = parts[1];
      data[name] = rawValue || rawValue === '' ? decodeURIComponent(rawValue) : true;
    });
  if (keys === null) return data;
  return pickValues(data, keys);
}

export function generate(params, keys = Object.keys(params)) {
  return keys
    .map((name) => {
      const value = params[name];
      if (!value && value !== '') return '';
      return encodeURIComponent(name) +
        (value !== true
            ? `=${encodeURIComponent(value)}`
            : ''
        );
    })
    .filter(part => part.length > 0)
    .join('&');
}
