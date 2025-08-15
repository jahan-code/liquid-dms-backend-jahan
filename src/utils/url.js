const BASE_URL = 'http://localhost:8001';
export function getFullImageUrl(filename) {
  return `${BASE_URL}/uploads/${filename}`;
}
