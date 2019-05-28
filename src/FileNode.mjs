class FileNode {
  constructor(fs, parent, name, mode, dev) {
    this.id = fs.nextInode();
    this.name = name;
    this.mode = mode;
    this.parent = parent || this;
    this.contents = new Uint8Array();

    this.node_ops = fs.nodeOps.file;
    this.stream_ops = fs.streamOps.file;
  }
}

export default FileNode;
