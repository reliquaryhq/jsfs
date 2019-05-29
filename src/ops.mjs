import DirNode from './DirNode';
import FileNode from './FileNode';
import { EINVAL, ENOENT } from './const';
import { isChrdev, isDir, isFile, isLink, } from './util/fs';
import { resizeNode } from './util/fs.mjs';

const nodeOps = {
  getattr: (fs, node) => {
    const attr = {};

    attr.dev = isChrdev(node.mode) ? node.id : 1;
    attr.ino = node.id;
    attr.mode = node.mode;
    attr.nlink = 1;
    attr.uid = 0;
    attr.gid = 0;
    attr.rdev = node.rdev;

    if (isDir(node.mode)) {
      attr.size = 4096;
    } else if (isFile(node.mode)) {
      attr.size = node.contents.length;
    } else if (isLink(node.mode)) {
      attr.size = node.link.length;
    } else {
      attr.size = 0;
    }

    attr.atime = new Date(node.timestamp);
    attr.mtime = new Date(node.timestamp);
    attr.ctime = new Date(node.timestamp);

    attr.blksize = 4096;
    attr.blocks = Math.ceil(attr.size / attr.blksize);

    return attr;
  },

  lookup: (fs, parent, name) => {
    const node = parent.contents[name];

    if (node) {
      return node;
    }

    throw new fs.ErrorClass(ENOENT);
  },

  mknod: (fs, parent, name, mode, dev) => {
    const node = isFile(mode)
      ? new FileNode(fs, parent, name, mode, dev)
      : new DirNode(fs, parent, name, mode, dev);

    if (parent) {
      parent.contents[name] = node;
    }

    return node;
  },

  readdir: (fs, node) => {
    const entries = ['.', '..'];

    for (const entry of Object.keys(node.contents)) {
      entries.push(entry);
    }

    return entries;
  },

  setattr: (fs, node, attr) => {
    if (attr.mode !== undefined) {
      node.mode = attr.mode;
    }

    if (attr.timestamp !== undefined) {
      node.timestamp = attr.timestamp;
    }

    if (attr.size !== undefined) {
      resizeNode(node, attr.size);
    }
  }
};

const streamOps = {
  llseek: (fs, stream, offset, whence) => {
    let position = offset;

    if (whence === 1) {
      position += stream.position;
    } else if (whence === 2) {
      if (isFile(stream.node.mode)) {
        position += stream.node.contents.length;
      }
    }

    if (position < 0) {
      throw new fs.ErrorClass(EINVAL);
    }

    return position;
  },

  read: (fs, stream, buffer, offset, length, position) => {
    const { node } = stream;
    const { contents } = node;

    if (position >= contents.length) {
      return 0;
    }

    const size = Math.min(contents.length - position, length);

    buffer.set(contents.subarray(position, position + size), offset);

    return size;
  },

  write: (fs, stream, buffer, offset, length, position, canOwn) => {
    const { node } = stream;

    if ((position || 0) + length > node.contents.length) {
      const contents = new Uint8Array((position || 0) + length);
      contents.set(node.contents, 0);
      node.contents = contents;
    }

    const { contents } = node;
    contents.set(buffer.subarray(offset, offset + length), position || 0);

    return length;
  }
};

export {
  nodeOps,
  streamOps
};
