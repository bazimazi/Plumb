import type { Drop, DropDamage } from './drop'
import { t } from '../i18n'

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
  const shell = { integrity: Math.max(0, drop.integrity), max: drop.integrityMax }
  if (drop.landingKind === 'hazard' && drop.captured === 'coin') return t('A shield converted the gutter into a coin landing. Shell remains {integrity}/{max}.', shell)
  return drop.captured ? t('The sphere settled in the {pocket} with {integrity}/{max} shell.', { pocket: t(names[drop.captured]), ...shell }) : t('The sphere is still in play.')
}

/** A detached observation of this fall. Never consumes events or changes the drop. */
export function describeDrop(drop: Drop): DropReport {
  const encounter = drop.board.encounter
  const objective: DropReport['objective'] = drop.board.boss
    ? { name: t('The Grinder'), progress: drop.coreHits, required: 5, complete: drop.wonBoss }
    : encounter ? { name: t(encounter.name), progress: drop.encounterProgress, required: encounter.required, complete: drop.encounterComplete } : undefined
  const resources: DropReport['resources'] = [
    { label: t('Nudges'), used: drop.nudgeUses, remaining: drop.nudges },
  ]
  if (drop.profile.special !== 'tilt' && drop.profile.specialCharges > 0) {
    resources.push({ label: t(drop.ballDef.specialName), used: drop.trickUses, remaining: drop.specials })
  }
  if (drop.profile.tiltCharges > 0) resources.push({ label: t('Tilt'), used: drop.tiltUses, remaining: drop.tilts })
  if (drop.board.shutterY != null) resources.push({ label: t('Gate flips'), used: drop.flipUses, remaining: drop.flips })
  resources.push({ label: t('Overdrive'), used: drop.overdriveUses, remaining: Math.max(0, drop.profile.overdriveMax - drop.overdriveUses) })

  let title: string
  let outcome: DropReport['outcome']
  let detail: string
  const finalDamage = drop.damageHistory.at(-1)
  if (!drop.launched) {
    outcome = 'aiming'; title = t('Ready to release'); detail = t('This sphere has not launched.')
  } else if (!drop.dead && !drop.captured) {
    outcome = 'in-flight'; title = t('Fall in progress'); detail = t('The sphere is still in play.')
  } else if (drop.terminalReason === 'timeout') {
    outcome = 'timeout'; title = t('Fall limit reached')
    detail = drop.board.boss && !drop.wonBoss
      ? t('The Grinder’s 25-second core-progress limit expired and the final shell was lost.')
      : t('The 80-second fall limit settled the sphere. {landing}', { landing: landing(drop) })
  } else if (drop.terminalReason === 'invalid-state') {
    outcome = 'invalid-state'; title = t('Fall settled'); detail = t('The fall settled after the sphere left a valid physics state.')
  } else if (drop.dead) {
    outcome = 'shatter'; title = t('Shell broken')
    detail = finalDamage?.cause === 'spike' ? t('A spike used the remaining shell.')
      : finalDamage?.cause === 'gutter' ? t('The gutter used the remaining shell.')
        : finalDamage?.cause === 'grinder-miss' ? t('A Grinder miss used the remaining shell.') : t('The shell reached zero.')
  } else if (drop.wonBoss) {
    outcome = 'boss-win'; title = t('The Grinder falls'); detail = t('All five core hits landed. {landing}', { landing: landing(drop) })
  } else if (drop.captured === 'hazard') {
    outcome = 'gutter'; title = t('Gutter landing'); detail = t('The gutter cost one shell. {landing}', { landing: landing(drop) })
  } else if (encounter) {
    outcome = drop.encounterComplete ? 'guardian-complete' : 'guardian-unfinished'
    title = drop.encounterComplete ? t('Guardian linked') : t('Guardian unfinished')
    const linked = t('{name}: {progress}/{required} relays linked.', { name: t(encounter.name), progress: drop.encounterProgress, required: encounter.required })
    const bounty = drop.encounterComplete
      ? t('The flat {bounty}-gear guardian bounty was added to this fall.', { bounty: encounter.bounty })
      : t('This optional objective does not block the route.')
    detail = `${linked} ${bounty} ${landing(drop)}`
  } else {
    outcome = 'landing'; title = drop.jackpot ? t('Jackpot landing') : t('Fall settled'); detail = landing(drop)
  }
  if (objective && !['guardian-complete', 'guardian-unfinished', 'boss-win'].includes(outcome)) {
    const params = { name: objective.name, progress: objective.progress, required: objective.required }
    detail += ` ${drop.board.boss ? t('{name}: {progress}/{required} core hits.', params) : t('{name}: {progress}/{required} relays linked.', params)}`
  }

  const tips: string[] = []
  if (objective && !objective.complete) {
    tips.push(drop.board.boss
      ? t('Five physical core hits open the Grinder’s maw; each miss costs shell.')
      : encounter?.sequence.length
        ? t('The Heartforge accepts alternating I–II–I–II relay contacts.')
        : t('The Bellkeeper accepts each of its three relays once, in any order.'))
  }
  if (drop.charge >= 1 && drop.overdriveUses < drop.profile.overdriveMax && drop.overdriveTime <= 0) {
    tips.push(t('The reactor is charged with an activation remaining. E provides a timed lift and scoring surge during a fall.'))
  } else if (drop.nudges > 0) {
    tips.push(drop.nudges === 1
      ? t('{n} nudge remains. A / D gives the sphere a short sideways push.', { n: drop.nudges })
      : t('{n} nudges remain. A / D gives the sphere a short sideways push.', { n: drop.nudges }))
  }
  if (tips.length < 2 && finalDamage) {
    tips.push(finalDamage.cause === 'spike' ? t('A spike cost shell during this fall. Inspect its lane before the next release.')
      : finalDamage.cause === 'gutter' ? t('The gutter cost shell. The machine overview shows its landing pockets.')
        : t('A Grinder miss cost shell. The core-hit count records progress toward opening the maw.'))
  }
  return {
    title, outcome, detail,
    advice: tips.slice(0, 2).join(' ') || t('Inspect the machine with V before your next release.'),
    elapsed: drop.time,
    earned: drop.earned,
    peakCombo: drop.peakCombo,
    resources,
    damage: drop.damageHistory.map(d => ({ time: d.time, cause: t(DAMAGE_NAMES[d.cause]), amount: d.amount })),
    ...(objective ? { objective } : {}),
  }
}
