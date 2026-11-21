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
  /** The machine's score target, 0 when it has none. */
  target: number
  /** Currency earned this fall. */
  gears: number
  peakCombo: number
  resources: { label: string; used: number; remaining: number }[]
  damage: { time: number; cause: string; amount: number }[]
  objective?: { name: string; progress: number; required: number; complete: boolean }
}

const DAMAGE_NAMES: Record<DropDamage['cause'], string> = {
  spike: 'Spike',
  gutter: 'Gutter',
  'grinder-miss': 'Grinder miss',
  short: 'Short of target',
}

function landing(drop: Drop): string {
  const names = { coin: 'Safe pocket', bonus: 'Rich pocket', jackpot: drop.jackpot ? 'Jackpot' : 'Cold maw', hazard: 'Gutter' }
  const shell = { integrity: Math.max(0, drop.integrity), max: drop.integrityMax }
  if (drop.landingKind === 'hazard' && drop.captured === 'coin') return t('Shield saved the gutter · {integrity}/{max} shell', shell)
  return drop.captured ? t('{pocket} · {integrity}/{max} shell', { pocket: t(names[drop.captured]), ...shell }) : t('Still in play')
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
  const finalDamage = drop.damageHistory.at(-1)
  // Short facts joined with " · ": the metrics, objective row and damage list carry the rest.
  const parts: string[] = []
  if (!drop.launched) {
    outcome = 'aiming'; title = t('Ready to release'); parts.push(t('Not launched yet'))
  } else if (!drop.dead && !drop.captured) {
    outcome = 'in-flight'; title = t('Fall in progress'); parts.push(t('Still in play'))
  } else if (drop.terminalReason === 'timeout') {
    outcome = 'timeout'; title = t('Fall limit reached')
    parts.push(drop.board.boss && !drop.wonBoss ? t('Core timer ran out · last shell lost') : t('80s limit'))
    if (!drop.board.boss || drop.wonBoss) parts.push(landing(drop))
  } else if (drop.terminalReason === 'invalid-state') {
    outcome = 'invalid-state'; title = t('Fall settled'); parts.push(t('Physics reset the sphere'))
  } else if (drop.dead) {
    outcome = 'shatter'; title = t('Shell broken')
    parts.push(finalDamage?.cause === 'spike' ? t('A spike took the last shell')
      : finalDamage?.cause === 'gutter' ? t('The gutter took the last shell')
        : finalDamage?.cause === 'grinder-miss' ? t('A Grinder miss took the last shell')
          : finalDamage?.cause === 'short' ? t('Short of target · last shell lost') : t('Shell gone'))
  } else if (drop.wonBoss) {
    outcome = 'boss-win'; title = t('The Grinder falls'); parts.push(landing(drop))
  } else if (drop.captured === 'hazard') {
    outcome = 'gutter'; title = t('Gutter landing'); parts.push(landing(drop))
  } else if (encounter) {
    outcome = drop.encounterComplete ? 'guardian-complete' : 'guardian-unfinished'
    title = drop.encounterComplete ? t('Guardian linked') : t('Guardian unfinished')
    parts.push(drop.encounterComplete ? t('+{bounty} gears bounty', { bounty: encounter.bounty }) : t('Optional · the route goes on'), landing(drop))
  } else {
    outcome = 'landing'; title = drop.jackpot ? t('Jackpot landing') : t('Fall settled'); parts.push(landing(drop))
  }
  if (drop.target && drop.captured && !drop.board.boss) {
    parts.push(drop.targetMet ? t('{score} / {target} target', { score: drop.earned, target: drop.target }) : t('{score} / {target} target · {short} short', { score: drop.earned, target: drop.target, short: drop.target - drop.earned }))
  }
  const detail = parts.join(' · ')

  const tips: string[] = []
  if (objective && !objective.complete) {
    tips.push(drop.board.boss
      ? t('Hit the core 5 times. Misses cost shell.')
      : encounter?.sequence.length
        ? t('Alternate I → II → I → II.')
        : t('Ring each bell once, any order.'))
  }
  if (drop.charge >= 1 && drop.overdriveUses < drop.profile.overdriveMax && drop.overdriveTime <= 0) {
    tips.push(t('Overdrive was ready and unused.'))
  } else if (drop.nudges > 0) {
    tips.push(t(drop.nudges === 1 ? '{n} nudge left unused.' : '{n} nudges left unused.', { n: drop.nudges }))
  }
  if (tips.length < 2 && finalDamage) {
    tips.push(finalDamage.cause === 'spike' ? t('Check the spike lanes before release.')
      : finalDamage.cause === 'gutter' ? t('Inspect shows the safe pockets.')
        : finalDamage.cause === 'short' ? t('Short? Overdrive climbs back into the pegs.')
          : t('Every core hit counts toward the maw.'))
  }
  return {
    title, outcome, detail,
    advice: tips.slice(0, 2).join(' ') || t('Inspect the machine before you release.'),
    elapsed: drop.time,
    earned: drop.earned,
    target: drop.target,
    gears: drop.gearsEarned,
    peakCombo: drop.peakCombo,
    resources,
    damage: drop.damageHistory.map(d => ({ time: d.time, cause: t(DAMAGE_NAMES[d.cause]), amount: d.amount })),
    ...(objective ? { objective } : {}),
  }
}
