import type { Drop, DropDamage } from './drop'

export interface DropReport {
  title: string
  /** Stable result key; title, detail and advice are display-ready copy. */
  outcome: 'aiming' | 'in-flight' | 'landing' | 'gutter' | 'shatter' | 'timeout' | 'invalid-state' | 'boss-win' | 'guardian-complete' | 'guardian-unfinished'
  detail: string
  advice: string
  elapsed: number
  earned: number
  peakCombo: number
  resources: { label: string; used: number; remaining: number }[]
  damage: { time: number; cause: string; amount: number }[]
  objective?: { name: string; progress: number; required: number; complete: boolean }
}

const DAMAGE_NAMES: Record<DropDamage['cause'], string> = {
  spike: 'Spike',
  gutter: 'Gutter',
  'grinder-miss': 'Grinder miss',
}

function landing(drop: Drop): string {
  const names = { coin: 'coin pocket', bonus: 'rich pocket', jackpot: drop.jackpot ? 'jackpot' : 'cold center pocket', hazard: 'gutter' }
  if (drop.landingKind === 'hazard' && drop.captured === 'coin') return `A shield converted the gutter into a coin landing. Shell remains ${Math.max(0, drop.integrity)}/${drop.integrityMax}.`
  return drop.captured ? `The sphere settled in the ${names[drop.captured]} with ${Math.max(0, drop.integrity)}/${drop.integrityMax} shell.` : 'The sphere is still in play.'
}

/** A detached observation of this fall. Never consumes events or changes the drop. */
export function describeDrop(drop: Drop): DropReport {
  const encounter = drop.board.encounter
  const objective: DropReport['objective'] = drop.board.boss
    ? { name: 'The Grinder', progress: drop.coreHits, required: 5, complete: drop.wonBoss }
    : encounter ? { name: encounter.name, progress: drop.encounterProgress, required: encounter.required, complete: drop.encounterComplete } : undefined
  const resources: DropReport['resources'] = [
    { label: 'Nudges', used: drop.nudgeUses, remaining: drop.nudges },
  ]
  if (drop.profile.special !== 'tilt' && drop.profile.specialCharges > 0) {
    resources.push({ label: drop.ballDef.specialName, used: drop.trickUses, remaining: drop.specials })
  }
  if (drop.profile.tiltCharges > 0) resources.push({ label: 'Tilt', used: drop.tiltUses, remaining: drop.tilts })
  if (drop.board.shutterY != null) resources.push({ label: 'Gate flips', used: drop.flipUses, remaining: drop.flips })
  resources.push({ label: 'Overdrive', used: drop.overdriveUses, remaining: Math.max(0, drop.profile.overdriveMax - drop.overdriveUses) })

  let title: string
  let outcome: DropReport['outcome']
  let detail: string
  const finalDamage = drop.damageHistory.at(-1)
  if (!drop.launched) {
    outcome = 'aiming'; title = 'Ready to release'; detail = 'This sphere has not launched.'
  } else if (!drop.dead && !drop.captured) {
    outcome = 'in-flight'; title = 'Fall in progress'; detail = 'The sphere is still in play.'
  } else if (drop.terminalReason === 'timeout') {
    outcome = 'timeout'; title = 'Fall limit reached'
    detail = drop.board.boss && !drop.wonBoss
      ? 'The Grinder’s 25-second core-progress limit expired and the final shell was lost.'
      : `The 80-second fall limit settled the sphere. ${landing(drop)}`
  } else if (drop.terminalReason === 'invalid-state') {
    outcome = 'invalid-state'; title = 'Fall settled'; detail = 'The fall settled after the sphere left a valid physics state.'
  } else if (drop.dead) {
    outcome = 'shatter'; title = 'Shell broken'
    detail = finalDamage?.cause === 'spike' ? 'A spike used the remaining shell.'
      : finalDamage?.cause === 'gutter' ? 'The gutter used the remaining shell.'
        : finalDamage?.cause === 'grinder-miss' ? 'A Grinder miss used the remaining shell.' : 'The shell reached zero.'
  } else if (drop.wonBoss) {
    outcome = 'boss-win'; title = 'The Grinder falls'; detail = `All five core hits landed. ${landing(drop)}`
  } else if (drop.captured === 'hazard') {
    outcome = 'gutter'; title = 'Gutter landing'; detail = `The gutter cost one shell. ${landing(drop)}`
  } else if (encounter) {
    outcome = drop.encounterComplete ? 'guardian-complete' : 'guardian-unfinished'
    title = drop.encounterComplete ? 'Guardian linked' : 'Guardian unfinished'
    detail = `${encounter.name}: ${drop.encounterProgress}/${encounter.required} relays linked.${drop.encounterComplete ? ` The flat ${encounter.bounty}-gear guardian bounty was added to this fall.` : ' This optional objective does not block the route.'} ${landing(drop)}`
  } else {
    outcome = 'landing'; title = drop.jackpot ? 'Jackpot landing' : 'Fall settled'; detail = landing(drop)
  }
  if (objective && !['guardian-complete', 'guardian-unfinished', 'boss-win'].includes(outcome)) {
    detail += ` ${objective.name}: ${objective.progress}/${objective.required} ${drop.board.boss ? 'core hits' : 'relays linked'}.`
  }

  const tips: string[] = []
  if (objective && !objective.complete) {
    tips.push(drop.board.boss
      ? 'Five physical core hits open the Grinder’s maw; each miss costs shell.'
      : encounter?.sequence.length
        ? 'The Heartforge accepts alternating I–II–I–II relay contacts.'
        : 'The Bellkeeper accepts each of its three relays once, in any order.')
  }
  if (drop.charge >= 1 && drop.overdriveUses < drop.profile.overdriveMax && drop.overdriveTime <= 0) {
    tips.push('The reactor is charged with an activation remaining. E provides a timed lift and scoring surge during a fall.')
  } else if (drop.nudges > 0) {
    tips.push(`${drop.nudges} nudge${drop.nudges === 1 ? '' : 's'} remain${drop.nudges === 1 ? 's' : ''}. A / D gives the sphere a short sideways push.`)
  }
  if (tips.length < 2 && finalDamage) {
    tips.push(finalDamage.cause === 'spike' ? 'A spike cost shell during this fall. Inspect its lane before the next release.'
      : finalDamage.cause === 'gutter' ? 'The gutter cost shell. The machine overview shows its landing pockets.'
        : 'A Grinder miss cost shell. The core-hit count records progress toward opening the maw.')
  }
  return {
    title, outcome, detail,
    advice: tips.slice(0, 2).join(' ') || 'Inspect the machine with V before your next release.',
    elapsed: drop.time,
    earned: drop.earned,
    peakCombo: drop.peakCombo,
    resources,
    damage: drop.damageHistory.map(d => ({ time: d.time, cause: DAMAGE_NAMES[d.cause], amount: d.amount })),
    ...(objective ? { objective } : {}),
  }
}
