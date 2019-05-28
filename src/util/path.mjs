const basename = (path) => {
  if (path === '/') {
    return '/';
  }

  const lastSlash = path.lastIndexOf('/');

  if (lastSlash === -1) {
    return path;
  }

  return path.substr(lastSlash + 1);
};

const dirname = (path) => {
  const parts = splitPath(path);
  const root = parts[0];
  let dir = parts[1];

  if (!root && !dir) {
    return '.';
  }

  if (dir) {
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};

const normalizeArray = (parts, allowAboveRoot) => {
  let up = 0;

  for (let i = parts.length - 1; i >= 0; i--) {
    const last = parts[i];

    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  if (allowAboveRoot) {
    for (; up; up--) {
      parts.unshift('..');
    }
  }

  return parts;
};

const normalize = (path) => {
  const isAbsolute = path.charAt(0) === '/';
  const trailingSlash = path.substr(-1) === '/';

  path = normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }

  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

const join2 = (l, r) => {
  return normalize(l + '/' + r);
};

export {
  basename,
  dirname,
  join2,
  normalize,
  normalizeArray,
};
