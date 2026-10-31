import fs from 'node:fs';
import path from 'node:path';

export function verifyLocalUrl(url, {build, baseUrl, source, stat = fs.statSync}) {
  if (!url.startsWith(baseUrl)) throw new Error(`URL outside baseUrl in ${source}: ${url}`);
  const relative = decodeURIComponent(url.slice(baseUrl.length).split(/[?#]/)[0]);
  const target = path.resolve(build, relative);
  const buildRoot = path.resolve(build);
  if (target !== buildRoot && !target.startsWith(`${buildRoot}${path.sep}`)) {
    throw new Error(`URL outside build directory in ${source}: ${url}`);
  }
  function info(file) {
    try {
      return stat(file);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
      throw error;
    }
  }
  const targetInfo = info(target);
  if (targetInfo?.isFile()) {
    if (relative.endsWith('/')) throw new Error(`File asset URL has trailing slash in ${source}: ${url}`);
    return;
  }
  if (targetInfo?.isDirectory() && info(path.join(target, 'index.html'))?.isFile()) return;
  throw new Error(`Missing generated asset/link in ${source}: ${url}`);
}
