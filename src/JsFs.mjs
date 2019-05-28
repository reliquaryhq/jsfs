import DirNode from './DirNode';
import FsError from './FsError';
import { basename, join2, normalize, normalizeArray } from './util/path';
import { lengthBytesUTF8, stringToUTF8Array } from './util/string';
import {
  isChrdev,
  isClosed,
  isDir,
  isFile,
  isLink,
  isMountpoint,
  isRoot,
  lookup,
  modeStringToFlags,
} from './util/fs';
import {
  EACCES,
  EEXIST,
  EINVAL,
  ENOENT,
  EPERM,
  O_ACCMODE,
  O_APPEND,
  O_CREAT,
  O_DIRECTORY,
  O_EXCL,
  O_RDONLY,
  O_TRUNC,
  S_IALLUGO,
  S_IFDIR,
  S_IFREG,
  S_IRUGO,
  S_IRWXUGO,
  S_ISVTX,
  S_IWUGO,
  S_IXUGO,
} from './const';
import { nodeOps, streamOps } from './ops';

class Stream {
  constructor(stream) {
  }
}

const MAX_OPEN_FDS = 4096;

class ReliquaryFs {
  constructor() {
    this.ErrorClass = FsError;
    this.nodeOps = this._buildNodeOps();
    this.streamOps = this._buildStreamOps();

    this._caseInsensitive = false;
    this._cwd = '/';
    this._inode = 0;
    this._nameTable = new Array(4096);
    this._root = new DirNode(this, null, '/', S_IFDIR | 0o777, 0);
    this._streams = {};
  }

  _buildNodeOps() {
    const getattr = (node) =>
      nodeOps.getattr(this, node);
    const lookup = (parent, name) =>
      nodeOps.lookup(this, parent, name);
    const mknod = (parent, name, mode, dev) =>
      nodeOps.mknod(this, parent, name, mode, dev);
    const readdir = (node) =>
      nodeOps.readdir(this, node);
    const setattr = (node, attr) =>
      nodeOps.setattr(this, node, attr);

    const ops = {
      dir: {
        getattr,
        lookup,
        mknod,
        readdir,
        setattr,
      },

      file: {
        getattr,
        setattr,
      },
    };

    return ops;
  }

  _buildStreamOps() {
    const llseek = (stream, offset, whence) =>
      streamOps.llseek(this, stream, offset, whence);
    const read = (stream, buffer, offset, length, position) =>
      streamOps.read(this, stream, buffer, offset, length, position);
    const write = (stream, buffer, offset, length, position, canOwn) =>
      streamOps.write(this, stream, buffer, offset, length, position, canOwn);

    const ops = {
      dir: {},

      file: {
        llseek,
        read,
        write,
      },
    };

    return ops;
  }

  close(stream) {
    if (isClosed(stream)) {
      throw new this.ErrorClass(EBADF);
    }

    if (stream.getdents) {
      stream.getdents = null;
    }

    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (error) {
      throw error;
    } finally {
      this.closeStream(stream.fd);
    }

    stream.fd = null;
  }

  closeStream(fd) {
    this._streams[fd] = null;
  }

  connect(fs) {
    if (fs.ErrnoError) {
      this.ErrorClass = fs.ErrnoError;
    }

    return this;
  }

  createStream(stream, fdStart, fdEnd) {
    const newStream = new Stream(stream);

    for (let p in stream) {
      newStream[p] = stream[p];
    }

    stream = newStream;

    const fd = this.nextFd(fdStart, fdEnd);
    stream.fd = fd;
    this._streams[fd] = stream;

    return stream;
  }

  cwd() {
    return this._cwd;
  }

  getPath(node) {
    let path;

    while (true) {
      if (isRoot(node)) {
        const mount = node.mount;
        const mountpoint = mount ? mount.mountpoint : '/';

        if (!path) {
          return mountpoint;
        }

        return mountpoint[mountpoint.length - 1] !== '/'
          ? mountpoint + '/' + path
          : mountpoint + path;
      }

      path = path ? node.name + '/' + path : node.name;
      node = node.parent;
    }
  }

  hashName(parentid, name) {
    let hash = 0;

    if (this._caseInsensitive) {
      name = name.toLowerCase();
    }

    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }

    return ((parentid + hash) >>> 0) % this._nameTable.length;
  }

  lookupNode(parent, name) {
    const error = this.mayLookup(parent);

    if (error) {
      throw new this.ErrorClass(error, parent);
    }

    const hash = this.hashName(parent.id, name);

    if (this._caseInsensitive) {
      name = name.toLowerCase();
    }

    for (let node = this._nameTable[hash]; node; node = node.name_next) {
      const nodeName = this._caseInsensitive
        ? node.name.toLowerCase()
        : node.name;

      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }

    return lookup(parent, name);
  }

  lookupPath(path, opts = {}) {
    path = this.resolve(this.cwd(), path);

    if (!path) {
      return { path: '', node: null };
    }

    const defaults = {
      follow_mount: true,
      recurse_count: 0
    };

    for (const key of Object.keys(defaults)) {
      if (opts[key] === undefined) {
        opts[key] = defaults[key];
      }
    }

    if (opts.recurse_count > 8) {
      throw new this.ErrorClass(ELOOP);
    }

    const parts = normalizeArray(path.split('/').filter((p) => !!p), false);

    let current = this._root;
    let currentPath = '/';

    for (let i = 0; i < parts.length; i++) {
      const isLast = (i === parts.length - 1);

      if (isLast && opts.parent) {
        break;
      }

      current = this.lookupNode(current, parts[i]);
      currentPath = join2(currentPath, parts[i]);

      if (isMountpoint(current)) {
        if (!isLast || (isLast && opts.follow_mount)) {
          current = current.mounted.root;
        }
      }

      if (!isLast || opts.follow) {
        let count = 0;

        while (isLink(current.mode)) {
          const link = this.readlink(current_path);
          currentPath = this.resolve(dirname(currentPath), link);

          const lookup = this.lookupPath(currentPath, { recurse_count: opts.recurse_count });
          current = lookup.node;

          if (count++ > 40) {
            throw new this.ErrorClass(ELOOP);
          }
        }
      }
    }

    return { path: currentPath, node: current };
  }

  mayCreate(dir, name) {
    try {
      this.lookupNode(dir, name);
      return EEXIST;
    } catch (error) {
    }

    return this.nodePermissions(dir, 'wx');
  }

  mayLookup(dir) {
    const error = this.nodePermissions(dir, 'x');

    if (error) {
      return error;
    }

    if (!dir.node_ops.lookup) {
      return EACCES;
    }

    return 0;
  }

  mkdir(path, mode) {
    mode = mode === undefined ? 0o777 : mode;
    mode &= S_IRWXUGO | S_ISVTX;
    mode |= S_IFDIR;

    return this.mknod(path, mode, 0);
  }

  mkdirTree(path, mode) {
    const parts = path.split('/');
    let p = '';

    for (let i = 0; i < parts.length; i++) {
      if (!parts[i]) {
        continue;
      }

      p += '/' + parts[i];

      try {
        this.mkdir(p, mode);
      } catch(error) {
        if (error.errno !== EEXIST) {
          throw error;
        }
      }
    }
  }

  mknod(path, mode, dev) {
    const lookup = this.lookupPath(path, { parent: true });
    const parent = lookup.node;
    const name = basename(path);

    if (!name || name === '.' || name === '..') {
      throw new this.ErrorClass(EINVAL);
    }

    const error = this.mayCreate(parent, name);

    if (error) {
      throw new this.ErrorClass(error);
    }

    if (!parent.node_ops.mknod) {
      throw new this.ErrorClass(EPERM);
    }

    return parent.node_ops.mknod(parent, name, mode, dev);
  }

  mount(mount) {
    const root = (mount.opts || {}).root || '/';

    if (root === '/') {
      return this._root;
    } else {
      throw new Error('not implemented');
    }
  }

  nextFd(fdStart, fdEnd) {
    fdStart = fdStart || 0;
    fdEnd = fdEnd || MAX_OPEN_FDS;

    for (let fd = fdStart; fd <= fdEnd; fd++) {
      if (!this._streams[fd]) {
        return fd;
      }
    }

    throw new this.ErrorClass(EMFILE);
  }

  nextInode() {
    return this._inode++;
  }

  nodePermissions(node, perms) {
    if (this._ignorePermissions) {
      return 0;
    }

    if (perms.indexOf('r') !== -1 && !(node.mode & S_IRUGO)) {
      return EACCES;
    } else if (perms.indexOf('w') !== -1 && !(node.mode & S_IWUGO)) {
      return EACCES;
    } else if (perms.indexOf('x') !== -1 && !(node.mode & S_IXUGO)) {
      return EACCES;
    }

    return 0;
  }

  open(path, flags, mode, fd_start, fd_end) {
    if (path === '') {
      throw new this.ErrorClass(ENOENT);
    }

    flags = typeof flags === 'string' ? modeStringToFlags(flags) : flags;
    mode = mode === undefined ? 0o666 : mode;

    if (flags & O_CREAT) {
      mode = (mode & S_IALLUGO) | S_IFREG;
    } else {
      mode = 0;
    }

    let node;

    if (typeof path === 'object') {
      node = path;
    } else {
      path = normalize(path);

      try {
        const lookup = FS.lookupPath(path, {
          follow: !(flags & O_NOFOLLOW)
        });

        node = lookup.node;
      } catch (error) {
      }
    }

    let created = false;

    if (flags & O_CREAT) {
      if (node) {
        if (flags & O_EXCL) {
          throw new this.ErrorClass(EEXIST);
        }
      } else {
        node = this.mknod(path, mode, 0);
        created = true;
      }
    }

    if (!node) {
      throw new this.ErrorClass(ENOENT);
    }

    if (isChrdev(node.mode)) {
      flags &= ~O_TRUNC;
    }

    if ((flags & O_DIRECTORY) && !isDir(node.mode)) {
      throw new this.ErrorClass(ENOTDIR);
    }

    if (!created) {
      const error = this.mayOpen(node, flags);

      if (error) {
        throw new this.ErrorClass(err);
      }
    }

    if (flags & O_TRUNC) {
      this.truncate(node, 0);
    }

    flags &= ~(O_EXCL | O_TRUNC);

    const stream = this.createStream({
      node,
      path: this.getPath(node),
      flags,
      seekable: true,
      position: 0,
      stream_ops: node.stream_ops,
      ungotten: [],
      error: false,
    }, fd_start, fd_end);

    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }

    return stream;
  }

  resolve(...paths) {
    let resolvedPath = '';
    let resolvedAbsolute = false;

    for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      const path = (i >= 0) ? paths[i] : this.cwd();

      if (typeof path !== 'string') {
        throw new TypeError('Arguments to resolve must be strings');
      } else if (!path) {
        return '';
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charAt(0) === '/';
    }

    resolvedPath = normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');

    return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
  }

  truncate(path, len) {
    if (len < 0) {
      throw new this.ErrorClass(EINVAL);
    }

    let node;

    if (typeof path === 'string') {
      const lookup = FS.lookupPath(path, { follow: true });
      node = lookup.node;
    } else {
      node = path;
    }

    if (!node.node_ops.setattr) {
      throw new this.ErrorClass(EPERM);
    }

    if (isDir(node.mode)) {
      throw new this.ErrorClass(EISDIR);
    }

    if (!isFile(node.mode)) {
      throw new this.ErrorClass(EINVAL);
    }

    const error = this.nodePermissions(node, 'w');

    if (error) {
      throw new this.ErrorClass(error);
    }

    node.node_ops.setattr(node, {
      size: len,
      timestamp: Date.now()
    });
  }

  write(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new this.ErrorClass(EINVAL);
    }

    if (isClosed(stream)) {
      throw new this.ErrorClass(EBADF);
    }

    if ((stream.flags & O_ACCMODE) === O_RDONLY) {
      throw new this.ErrorClass(EBADF);
    }

    if (isDir(stream.node.mode)) {
      throw new this.ErrorClass(EISDIR);
    }

    if (!stream.stream_ops.write) {
      throw new this.ErrorClass(EINVAL);
    }

    if (stream.flags & O_APPEND) {
      this.llseek(stream, 0, SEEK_END);
    }

    const seeking = position === undefined;

    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new this.ErrorClass(ESPIPE);
    }

    const bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);

    if (!seeking) {
      stream.position += bytesWritten;
    }

    return bytesWritten;
  }

  writeFile(path, data, opts = {}) {
    opts.flags = opts.flags || 'w';
    const stream = this.open(path, opts.flags, opts.mode);

    if (typeof data === 'string') {
      const buf = new Uint8Array(lengthBytesUTF8(data) + 1);
      const byteLength = stringToUTF8Array(data, buf, 0, buf.length);
      this.write(stream, buf, 0, byteLength, undefined, opts.canOwn);
    } else if (ArrayBuffer.isView(data)) {
      this.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
    } else {
      throw new Error('Unsupported data type');
    }

    this.close(stream);
  }
}

export default ReliquaryFs;
