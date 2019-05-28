import {
  FLAG_MODES,
  S_IFCHR,
  S_IFDIR,
  S_IFLNK,
  S_IFMT,
  S_IFREG,
} from '../const';

const isChrdev = (mode) => {
  return (mode & S_IFMT) === S_IFCHR;
};

const isClosed = (stream) => stream.fd === null;

const isDir = (mode) => {
  return (mode & S_IFMT) === S_IFDIR;
};

const isFile = (mode) => {
  return (mode & S_IFMT) === S_IFREG;
};

const isLink = (mode) => {
  return (mode & S_IFMT) === S_IFLNK;
};

const isMountpoint = (node) => !!node.mounted;

const isRoot = (node) => node === node.parent;

const lookup = (parent, name) => {
  return parent.node_ops.lookup(parent, name);
};

const modeStringToFlags = (str) => {
  const flags = FLAG_MODES[str];

  if (flags === undefined) {
    throw new Error('Unknown file open mode: ' + str);
  }

  return flags;
};

export {
  isChrdev,
  isClosed,
  isDir,
  isFile,
  isLink,
  isMountpoint,
  isRoot,
  lookup,
  modeStringToFlags,
};
