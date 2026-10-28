export const videoByteLimit = 100 * 1024 * 1024;
export const selectedImageByteLimit = 15 * 1024 * 1024;
export const encodedImageByteLimit = 10 * 1024 * 1024;
export const imageLongestEdge = 1600;

export function withinLimit(size: number, limit: number) {
  return Number.isSafeInteger(size) && size > 0 && size <= limit;
}

export function withinLongestEdge(edge: number) {
  return Number.isSafeInteger(edge) && edge > 0 && edge <= imageLongestEdge;
}
