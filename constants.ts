
import { TrimSize, BookTheme } from './types';

export const KDP_TRIM_SIZES: TrimSize[] = [
  { name: '5" x 8" (12.7 x 20.32 cm)', widthInches: 5, heightInches: 8 },
  { name: '5.25" x 8" (13.34 x 20.32 cm)', widthInches: 5.25, heightInches: 8 },
  { name: '5.5" x 8.5" (13.97 x 21.59 cm)', widthInches: 5.5, heightInches: 8.5 },
  { name: '6" x 9" (15.24 x 22.86 cm)', widthInches: 6, heightInches: 9 },
  { name: '8.5" x 11" (21.59 x 27.94 cm)', widthInches: 8.5, heightInches: 11 },
];

export const FONT_FAMILIES = [
    'Merriweather',
    'Lato',
    'Lora',
    'Montserrat',
    'Open Sans',
    'Roboto',
    'Playfair Display',
    'Crimson', // Good for 'Classic' theme
];

export const BOOK_THEMES: BookTheme[] = [
    'Classic',
    'Reedsy',
    'Romance',
];
