class DirNode {
  constructor(fs, parent, name, mode, dev) {
    this.id = fs.nextInode();
    this.name = name;
    this.mode = mode;
    this.parent = parent || this;
    this.contents = {};
    this.mount = this.parent.mount;
    this.mounted = null;

    this.node_ops = fs.nodeOps.dir;
    this.stream_ops = fs.streamOps.dir;
  }
}

export default DirNode;
