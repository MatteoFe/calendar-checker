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

// Event colors as shown by the current Google Calendar UI, keyed by event colorId.
// The API /colors endpoint returns the older classic palette, which looks different.
const EVENT_COLORS: Readonly<Record<string, string>> = {
  '1': '#7986cb', // Lavender
  '2': '#33b679', // Sage
  '3': '#8e24aa', // Grape
  '4': '#e67c73', // Flamingo
  '5': '#f6bf26', // Banana
  '6': '#f4511e', // Tangerine
  '7': '#039be5', // Peacock
  '8': '#616161', // Graphite
  '9': '#3f51b5', // Blueberry
  '10': '#0b8043', // Basil
  '11': '#d50000', // Tomato
};

export const eventColor = (colorId: string | undefined): string | undefined =>
  colorId === undefined ? undefined : EVENT_COLORS[colorId];
