const BASE_URL = 'https://liquid.thedevapp.online';
export function getFullImageUrl(filename) {
  return `${BASE_URL}/uploads/${filename}`;
}
