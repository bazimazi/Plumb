import type { ThemeName } from '../sim/board'

export interface Palette {
  bg0: string
  bg1: string
  felt: string
  frame: string
  frameDeep: string
  peg: string
  pegDeep: string
  gold: string
  danger: string
  accent: string
  steel: string
  well: string
}

export const PALETTE: Record<ThemeName, Palette> = {
  workshop: {
    bg0: '#0a0b2e',
    bg1: '#1b3478',
    felt: '#122a63',
    frame: '#ffc93c',
    frameDeep: '#6a4a12',
    peg: '#e9fbff',
    pegDeep: '#3d76c2',
    gold: '#ffd23f',
    danger: '#ff4d5e',
    accent: '#36e2ff',
    steel: '#dbe8ff',
    well: '#a77bff',
  },
  foundry: {
    bg0: '#1c0820',
    bg1: '#5a1446',
    felt: '#3a0f36',
    frame: '#ff9a3c',
    frameDeep: '#7a2c12',
    peg: '#fff0e2',
    pegDeep: '#c2532e',
    gold: '#ffd23f',
    danger: '#ff3d5a',
    accent: '#ff7bd0',
    steel: '#ffe1d0',
    well: '#ffb36b',
  },
  gravity: {
    bg0: '#0d0626',
    bg1: '#3a1c8a',
    felt: '#22135e',
    frame: '#b99bff',
    frameDeep: '#3d2a80',
    peg: '#f4efff',
    pegDeep: '#7a62d6',
    gold: '#ffe066',
    danger: '#ff4d8a',
    accent: '#a77bff',
    steel: '#e6ddff',
    well: '#5bd0ff',
  },
  grinder: {
    bg0: '#071a14',
    bg1: '#0f4a36',
    felt: '#0d3328',
    frame: '#c8ff5a',
    frameDeep: '#3e5a12',
    peg: '#f2ffe6',
    pegDeep: '#4f9a52',
    gold: '#ffe066',
    danger: '#ff4d4d',
    accent: '#7dff9a',
    steel: '#e4ffd6',
    well: '#c8ff5a',
  },
}
