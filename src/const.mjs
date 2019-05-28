const EACCES      = 9973;
const EEXIST      = 9955;
const EINVAL      = 9943;
const ENOENT      = 9968;
const EPERM       = 9972;

const O_PATH      = 0o10000000;

const O_SEARCH    = O_PATH;
const O_ACCMODE   = 0o3 | O_SEARCH;
const O_RDONLY    = 0o0;
const O_WRONLY    = 0o1;
const O_RDWR      = 0o2;

const O_CREAT     = 0o100;
const O_EXCL      = 0o200;
const O_NOCTTY    = 0o400;
const O_TRUNC     = 0o1000;
const O_APPEND    = 0o2000;
const O_NONBLOCK  = 0o4000;
const O_DSYNC     = 0o10000;
const O_SYNC      = 0o4010000;
const O_RSYNC     = 0o4010000;
const O_DIRECTORY = 0o200000;
const O_NOFOLLOW  = 0o400000;
const O_CLOEXEC   = 0o2000000;

const S_IFMT      = 0o170000;
const S_IFDIR     = 0o040000;
const S_IFCHR     = 0o020000;
const S_IFBLK     = 0o060000;
const S_IFREG     = 0o100000;
const S_IFIFO     = 0o010000;
const S_IFLNK     = 0o120000;
const S_IFSOCK    = 0o140000;

const S_ISUID     = 0o4000;
const S_ISGID     = 0o2000;
const S_ISVTX     = 0o1000;

const S_IRWXU     = 0o700;
const S_IRWXG     = 0o070;
const S_IRWXO     = 0o007;
const S_IRUSR     = 0o400;
const S_IRGRP     = 0o040;
const S_IROTH     = 0o004;
const S_IWUSR     = 0o200;
const S_IWGRP     = 0o020;
const S_IWOTH     = 0o002;
const S_IXUSR     = 0o100;
const S_IXGRP     = 0o010;
const S_IXOTH     = 0o001;

const S_IRWXUGO   = S_IRWXU | S_IRWXG | S_IRWXO;
const S_IALLUGO   = S_ISUID | S_ISGID | S_ISVTX |S_IRWXUGO;
const S_IRUGO     = S_IRUSR | S_IRGRP | S_IROTH;
const S_IWUGO     = S_IWUSR | S_IWGRP | S_IWOTH;
const S_IXUGO     = S_IXUSR | S_IXGRP | S_IXOTH;

const FLAG_MODES = {
  'r':    O_RDONLY,
  'rs':   O_RDONLY | O_SYNC,
  'r+':   O_RDWR,
  'w':    O_TRUNC | O_CREAT | O_WRONLY,
  'wx':   O_TRUNC | O_CREAT | O_WRONLY | O_EXCL,
  'xw':   O_TRUNC | O_CREAT | O_WRONLY | O_EXCL,
  'w+':   O_TRUNC | O_CREAT | O_RDWR,
  'wx+':  O_TRUNC | O_CREAT | O_RDWR | O_EXCL,
  'xw+':  O_TRUNC | O_CREAT | O_RDWR | O_EXCL,
  'a':    O_APPEND | O_CREAT | O_WRONLY,
  'ax':   O_APPEND | O_CREAT | O_WRONLY | O_EXCL,
  'xa':   O_APPEND | O_CREAT | O_WRONLY | O_EXCL,
  'a+':   O_APPEND | O_CREAT | O_RDWR,
  'ax+':  O_APPEND | O_CREAT | O_RDWR | O_EXCL,
  'xa+':  O_APPEND | O_CREAT | O_RDWR | O_EXCL,
};

export {
  EACCES,
  EEXIST,
  EINVAL,
  ENOENT,
  EPERM,
  FLAG_MODES,
  O_ACCMODE,
  O_APPEND,
  O_CLOEXEC,
  O_CREAT,
  O_DIRECTORY,
  O_DSYNC,
  O_EXCL,
  O_NOCTTY,
  O_NOFOLLOW,
  O_NONBLOCK,
  O_RDONLY,
  O_RSYNC,
  O_TRUNC,
  S_IALLUGO,
  S_IFBLK,
  S_IFCHR,
  S_IFDIR,
  S_IFIFO,
  S_IFLNK,
  S_IFMT,
  S_IFREG,
  S_IFSOCK,
  S_IRUGO,
  S_IRWXUGO,
  S_ISVTX,
  S_IWUGO,
  S_IXUGO,
};
