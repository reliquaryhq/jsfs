class FsError extends Error {
  constructor(errno, node) {
    super();
    this.errno = errno;
  }
}

export default FsError;
