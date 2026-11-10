import { CURRENT_RULES, type RulesVersion } from '../meta/expedition'
import { computeProfile } from '../sim/profile'
import type { GameNode } from './route'

export interface PracticeRecipe {
  seed: string
  ballId: string
  node: GameNode
  upgrades: string[]
  relics: string[]
  integrity: number
  integrityMax: number
  ascension: number
  loop: number
  boardNonce: number
  rules: RulesVersion
  mode: 'expedition' | 'daily'
  matched: boolean
}

interface PracticeMachine {
  id: string
  name: string
  text: string
  goal: string
  layout: GameNode['layout']
  theme: GameNode['theme']
  encounter?: GameNode['encounter']
}

export const PRACTICE_MACHINES: readonly PracticeMachine[] = [
  { id: 'workshop', name: 'Workshop', text: 'First contacts & the gate', goal: 'Read the first contact, steer toward a useful lane, and finish in a safe collector.', layout: 'workshop', theme: 'workshop' },
  { id: 'garden', name: 'Glass Garden', text: 'Springs & vanishing teeth', goal: 'Use the spring and vanishing pegs to keep a chain alive. Try a different opening on each attempt.', layout: 'garden', theme: 'workshop' },
  { id: 'furnace', name: 'Furnace', text: 'Moving pegs & spikes', goal: 'Watch the moving pegs and spend control before a spike or gutter takes shell.', layout: 'furnace', theme: 'foundry' },
  { id: 'press', name: 'Iron Press', text: 'A demanding descent', goal: 'Inspect the whole machine, then find a line that protects the shell through the foundry.', layout: 'elite', theme: 'foundry' },
  { id: 'bellkeeper', name: 'Bellkeeper', text: 'Three bells, any order', goal: 'Ring each physical bell once. An unfinished objective grants one safe collector return before 75 seconds.', layout: 'garden', theme: 'workshop', encounter: 'bellkeeper' },
  { id: 'heartforge', name: 'Heartforge', text: 'I → II → I → II', goal: 'Alternate physical contacts with the left and right relays. Wrong contacts preserve your progress.', layout: 'furnace', theme: 'foundry', encounter: 'heartforge' },
  { id: 'gravity', name: 'Gravity Core', text: 'Wells & portals', goal: 'Read the gravity wells and portal exits. Aim your interventions toward the next useful contact.', layout: 'core', theme: 'gravity' },
  { id: 'grinder', name: 'The Grinder', text: 'Five physical core strikes', goal: 'Strike the core five times. Missed collectors cost shell and return you to the fight; use your reserves deliberately.', layout: 'grinder', theme: 'grinder' },
]

export const PRACTICE_BUILDS = [
  { id: 'stock', name: 'Stock sphere', text: 'Base physics and control reserves.', upgrades: [] as string[], relics: [] as string[] },
  { id: 'control', name: 'Flight controls', text: 'Plumb Line, Capacitor, and Shock Absorber.', upgrades: ['plumb-line', 'capacitor', 'shock-absorber'], relics: [] as string[] },
  { id: 'resonance', name: 'Arc & rudder', text: 'Plumb Line and Capacitor with Arc Coil and Golden Rudder.', upgrades: ['plumb-line', 'capacitor'], relics: ['arc-coil', 'golden-rudder'] },
] as const

/** Fresh, independent inputs. No archive, route stream, or expedition save is consulted. */
export function practiceRecipe(machineId: string, ballId: string, buildId: string, seed: string): PracticeRecipe {
  const machine = PRACTICE_MACHINES.find(m => m.id === machineId) ?? PRACTICE_MACHINES[0]
  const build = PRACTICE_BUILDS.find(b => b.id === buildId) ?? PRACTICE_BUILDS[0]
  const profile = computeProfile(ballId, [...build.upgrades], [...build.relics])
  return {
    seed, ballId, upgrades: [...build.upgrades], relics: [...build.relics],
    integrity: profile.integrityMax, integrityMax: profile.integrityMax,
    ascension: 0, loop: 0, boardNonce: 0, rules: CURRENT_RULES, mode: 'expedition', matched: false,
    node: {
      id: machine.id, kind: machine.layout === 'grinder' ? 'boss' : 'drop',
      title: machine.name, kicker: 'Practice laboratory', sector: machine.theme === 'workshop' ? 1 : machine.theme === 'foundry' ? 2 : 3,
      depth: 1, theme: machine.theme, risk: machine.layout === 'grinder' ? 'boss' : 'safe',
      layout: machine.layout, encounter: machine.encounter, blurb: machine.goal,
    },
  }
}

export function copyRecipe(recipe: PracticeRecipe): PracticeRecipe {
  return { ...recipe, node: { ...recipe.node }, upgrades: [...recipe.upgrades], relics: [...recipe.relics] }
}

export function recipeMachine(recipe: PracticeRecipe): string {
  return recipe.node.encounter ?? PRACTICE_MACHINES.find(m => m.layout === recipe.node.layout && !m.encounter)?.id ?? 'workshop'
}
