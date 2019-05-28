const lengthBytesUTF8 = (str) => {
  let len = 0;

  for (let i = 0; i < str.length; i++) {
    let u = str.charCodeAt(i);

    if (u >= 0xD800 && u <= 0xDFFF) {
      u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    }

    if (u <= 0x7F) {
      len += 1;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else {
      len += 4;
    }
  }

  return len;
};

const stringToUTF8Array = (str, outU8Array, outIdx, maxBytesToWrite) => {
  if (!(maxBytesToWrite > 0)) {
    return 0;
  }

  const startIdx = outIdx;
  const endIdx = outIdx + maxBytesToWrite - 1;

  for (let i = 0; i < str.length; i++) {
    let u = str.charCodeAt(i);

    if (u >= 0xD800 && u <= 0xDFFF) {
      let u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }

    if (u <= 0x7F) {
      if (outIdx >= endIdx) {
        break;
      }

      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) {
        break;
      }

      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) {
        break;
      }

      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) {
        break;
      }

      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }

  outU8Array[outIdx] = 0;

  return outIdx - startIdx;
};

export {
  lengthBytesUTF8,
  stringToUTF8Array,
};
