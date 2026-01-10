// DejaVu Sans font - supports Cyrillic characters
// This is a subset of DejaVu Sans that includes Cyrillic characters for Bulgarian

export const loadCyrillicFont = async (): Promise<string | null> => {
  try {
    // Use a CDN-hosted font that supports Cyrillic
    const response = await fetch('https://cdn.jsdelivr.net/npm/@aspect-build/bazel-action-listener@0.0.1/fonts/dejavu-sans/DejaVuSans.ttf');
    if (!response.ok) {
      // Fallback to another source
      const fallbackResponse = await fetch('https://raw.githubusercontent.com/nicbarker/lifelike-glyph/main/fonts/DejaVuSans.ttf');
      if (!fallbackResponse.ok) {
        return null;
      }
      const arrayBuffer = await fallbackResponse.arrayBuffer();
      return arrayBufferToBase64(arrayBuffer);
    }
    const arrayBuffer = await response.arrayBuffer();
    return arrayBufferToBase64(arrayBuffer);
  } catch (error) {
    console.error('Failed to load Cyrillic font:', error);
    return null;
  }
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Noto Sans font URL - reliable source for Cyrillic
export const NOTO_SANS_CYRILLIC_URL = 'https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5aPdu3mhPy0.ttf';

export const loadNotoSansCyrillic = async (): Promise<string | null> => {
  try {
    const response = await fetch(NOTO_SANS_CYRILLIC_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch Noto Sans');
    }
    const arrayBuffer = await response.arrayBuffer();
    return arrayBufferToBase64(arrayBuffer);
  } catch (error) {
    console.error('Failed to load Noto Sans Cyrillic font:', error);
    return null;
  }
};
