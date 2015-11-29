export function parse(query, keys = null) {
  const data = {};
  query.split('&')
    .forEach(part=> {
      if (part === '') return;
      const parts = part.split('=');
      const name = decodeURIComponent(parts[0]);
      const rawValue = parts[1];
      data[name] = rawValue || rawValue === '' ? decodeURIComponent(rawValue) : true;
    });
  if (keys === null) return data;
  const res = {};
  keys.forEach(name=> {
    res[name] = data[name] || false;
  });
  return res;
}

export function generate(params, keys = Object.keys(params)) {
  return keys
    .map((name)=> {
      const value = params[name];
      if (!value && value !== '') return '';
      return encodeURIComponent(name) +
        (value !== true
            ? '=' + encodeURIComponent(value)
            : ''
        );
    })
    .filter(part=>part.length > 0)
    .join('&');
}
