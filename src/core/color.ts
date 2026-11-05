const DARK_TEXT = '#1f2937';
const LIGHT_TEXT = '#ffffff';
const LIGHTNESS_THRESHOLD = 150;

// Picks dark or light text for a #rrggbb background (perceived luminance)
export const readableTextColor = (background: string): string => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(background);
  if (!match) return LIGHT_TEXT;
  const [r = 0, g = 0, b = 0] = match.slice(1).map((hex) => parseInt(hex, 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > LIGHTNESS_THRESHOLD ? DARK_TEXT : LIGHT_TEXT;
};
