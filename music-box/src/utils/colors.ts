import { TrackColor } from '../types';

interface ColorDef {
  bg: string;
  text: string;
  border: string;
  shadow: string;
  label: string;
  swatch: string;
}

export const TRACK_COLORS: Record<TrackColor, ColorDef> = {
  red:    { bg: '#7a1818', text: '#ffe8e8', border: '#a02020', shadow: 'rgba(122,24,24,0.6)',    label: 'Crimson',  swatch: '#8B2020' },
  orange: { bg: '#9e4d00', text: '#fff4e8', border: '#c06000', shadow: 'rgba(158,77,0,0.6)',     label: 'Ember',    swatch: '#C06000' },
  yellow: { bg: '#7a6400', text: '#fffce8', border: '#9c8000', shadow: 'rgba(122,100,0,0.6)',    label: 'Gold',     swatch: '#9A8000' },
  green:  { bg: '#154f22', text: '#e8fef0', border: '#1e6b2f', shadow: 'rgba(21,79,34,0.6)',     label: 'Verdant',  swatch: '#1A6030' },
  blue:   { bg: '#12305e', text: '#e8f0ff', border: '#1a4280', shadow: 'rgba(18,48,94,0.6)',     label: 'Sapphire', swatch: '#1A3A6E' },
  indigo: { bg: '#1e1260', text: '#eae8ff', border: '#2a1a80', shadow: 'rgba(30,18,96,0.6)',     label: 'Arcane',   swatch: '#2A1A6E' },
  violet: { bg: '#4a1260', text: '#ffe8ff', border: '#621880', shadow: 'rgba(74,18,96,0.6)',     label: 'Mystic',   swatch: '#5A1A6E' },
  black:  { bg: '#0a0a0a', text: '#e8e0d8', border: '#222222', shadow: 'rgba(10,10,10,0.8)',     label: 'Void',     swatch: '#1a1a1a' },
  white:  { bg: '#f0ebe0', text: '#1a1208', border: '#c8baa0', shadow: 'rgba(200,186,160,0.4)',  label: 'Ivory',    swatch: '#F5F0E8' },
};

export const ALL_COLORS: TrackColor[] = [
  'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'black', 'white',
];

export function getArtworkUrl(template: string, size = 300): string {
  return template.replace('{w}', String(size)).replace('{h}', String(size));
}
