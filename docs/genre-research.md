# PLUMB: genre research and product direction

Research date: **23 October 2026**. Implementation status updated **24 October 2026** for v0.1. This is a design evidence brief, not a forecast of commercial success. Virality cannot be guaranteed. Recommendations below are original proposals for PLUMB; competitor mechanics, art, characters, names, and presentation are reference material, not assets to reproduce.

## What the current game makes possible

The baseline repository already has a strong distinction: the player keeps influencing a falling sphere through limited nudges, a gate, and a sphere-specific ability. This offers a more active identity than simply watching a scoring engine resolve. Its celestial machine setting can make those interventions feel like operating a temperamental instrument.

Inspection of the initial `README.md`, `src/content/catalog.ts`, `src/game/route.ts`, `src/game/offers.ts`, `src/meta/save.ts`, and `src/game/game.ts` found three spheres, ten relics, ten upgrades, challenges, permanent catalogue unlocks, cosmetic trails, seeded boards, branching choices, and one final boss. The initial route had a fixed encounter graph; its randomization primarily changed the order in which fork options appeared. Seeds were already salted for different systems, but reward pools depended on the profile's researched relics. Consequently, matching a bare seed did not guarantee matching offers across profiles. These are code observations from the starting build, not claims about the completed expansion.

**Priority hypothesis:** increase the number of interesting builds and decisions a player can discover across runs; preserve a clear, satisfying end to each run. Additional minutes of passive bouncing are a poor substitute for meaningful replayability.

## Implemented through v0.1

The implementation now addresses the central recommendations with concrete, inspectable systems:

| Research priority | Implemented mechanics |
| --- | --- |
| Meaningful adventure pacing | Three acts with ten machines on the standard path, an optional eleventh, visible safe/risky forks, three choice events, shops, and full repairs between acts. Seeded room identities, selected layouts, and six board anomalies vary the journey. |
| Distinct physical objectives | Bellkeeper bells in Act I can be linked once each in any order; Heartforge relays in Act II require I → II → I → II. The HUD shows objective, actual credit/next target, flat gear bounty, and one finite safe-collector return. Completion offers a surviving relic draft; incompletion does not block the route. |
| Playable teaching | Fresh-profile Workshop tips respond to aiming, actual nudging, and charged Overdrive. Relevant controls are highlighted. Dismissal is saved, and How to play can enable tips again without replacing the checkpoint. Sphere tricks still use the field guide. |
| Build discovery | A starting relic draft; eighteen relics and fourteen upgrades; new interactions around chains, nudge recovery, portals, clean landings, shattering, protection, and earned-gear investment. The journal explains owned items and shows build themes. |
| Goals and mastery | Three seeded commissions drawn from six goals, progress in the journal, immediate completion rewards, sphere-specific Trials 0–6, and a victory choice to bank the run or retain the build for a harder circuit. |
| Returning and sharing | A UTC daily constellation with a fixed sphere and full relic archive; twenty recent local run records with replay and share actions; versioned challenge URLs containing starting sphere, trial, and the run's catalogue. New rules 3 routes include guardians, while rules 2 links/checkpoints/replays retain the classic route. Daily personal bests are separated by rules version and remain local. |
| Trust and inspection | Checkpoints at decision/aim boundaries, restoration of the current machine from its beginning after reload, automatic pause when the tab is hidden, an inspectable route/build journal, and bounded handling for stalled falls and boss returns. |
| Pacing control | Saved 0.75×, 1×, 1.5×, and 2× fall-speed options retain the fixed physics step. Slower play gives more reaction time; motion and large-type controls remain available. |

This mapping comes from source inspection, not an external audience study. Regression scripts cover builds, routes, and expedition integration. The v0.3 pass adds Playwright interaction and screenshot checks in desktop Chromium, touch-emulated phone/tablet Chromium, and Firefox. These complement Canvas simulation; they cannot establish physical-device ergonomics or player enjoyment.

The v0.4 guardian pass applies the optional-objective recommendation without adding machines or requiring every objective for progression. One automatic safe return is available only while the objective is incomplete, before 75 seconds of simulation time. It preserves progress and resources without refilling them or awarding a landing payout. Hazard gutters cannot trigger it, including when shielded. Flat bounties prevent Overdrive/economy multiplication, and the risky Bellkeeper kiln retains its original surviving relic instead of adding a second draft. The guardian suite passes 12 checks and 720 actual falls; all 40 Playwright scenarios pass, including natural guardian clears through the earned relic draft. See [implementation and validation notes](expedition-design.md) for exact behavior, evidence limits, and compatibility boundaries.

The v0.1 learning pass adds factual completed-fall analysis and an isolated practice laboratory. Reports distinguish shell-damage sources, actual accepted controls, objective progress, remaining reserves, and timeout settlement. Eight practice setups, three spheres, and three loadouts reuse the real simulation. A completed expedition can reproduce its last machine with the same board, build, starting shell, trial, circuit, and rules. Comparisons are session-only and practice preserves both the archive and expedition checkpoint. These implement the earlier proposals without introducing login rewards or increasing campaign length. Verification passes 56 Playwright scenarios, 35 controller integration checks, and 15 report checks; the report instrumentation preserves a 42-fall simulation fingerprint. This evidence verifies behavior rather than proving learning or retention gains.

The next validation work is focused: observe whether Workshop coaching teaches intentional interventions, whether guardian credit and safe-return limits are understood, whether the debrief explains losses and practice enables a deliberate second approach, voluntary second runs, actual run duration, difficulty by sphere, readable item interactions, interruption recovery, and keyboard/touch behavior on real devices. Remapping, global score validation, localization, a creator-ready demo, and launch assets remain separate work. No measured retention, sales, launch-readiness, or viral outcome is claimed.

## Evidence from the genre

The sources below are developer/publisher product pages, developer statements, platform documentation, and firsthand player reports. Store descriptions establish advertised features, not whether those features caused success. Forum posts establish individual experiences, not population-wide sentiment.

| Primary evidence | What it supports | Inference for PLUMB |
| --- | --- | --- |
| [Peglin: official product description](https://store.steampowered.com/app/1296610/Peglin/) describes upgradeable orbs, physics-changing relics, and changing maps. | Build variation and the physical board both belong to this audience's expectations. | Give routes and board rules enough variation to make a familiar sphere support different plans. Keep PLUMB's interventions central. |
| [Peglin: official updates](https://steamcommunity.com/app/1296610/announcements/), notably v1.1.18 (29 October 2025), moved niche relics into shops, expanded choice, added skip compensation, and seeded previously random systems. Subsequent patches fixed seed inconsistencies and stuck-board cases. | More catalogue entries can create poor offers; reproducibility and softlock prevention are real maintenance concerns. | Offer a useful baseline option, show when an effect can trigger, provide a meaningful skip, and test unusual interaction chains. A larger pool needs better curation. |
| [Ballionaire: official product description](https://store.steampowered.com/app/2667120/Ballionaire/) advertises markedly different boards, rule modifiers, bans, a sandbox, shareable boards, and user content. | Replayability can come from changing the problem and experimenting with systems, rather than increasing campaign length. | Mutators, alternate objectives, and later a practice laboratory can reuse PLUMB's physics while producing new decisions. Full mod support is a later production investment. |
| [Balatro: official product description](https://store.steampowered.com/app/2379780/Balatro/) lists eight difficulties, distinct starting decks, challenge and seeded runs, collection discovery, and detailed statistics. | A finite victory can coexist with extensive mastery and discovery goals. | Add difficulty progression, fixed challenges, a visible collection, and records that remind players of an unfinished experiment. Do not turn all progression into permanent strength. |
| [Mega Crit's GDC session](https://www.gdcvault.com/play/1025731) and its [official recording](https://www.youtube.com/watch?v=7rqfbvnO_H0) describe metrics and community feedback as part of Slay the Spire's balance process. | Balance is an ongoing observation-and-iteration process. | Record choices offered as well as choices selected, then combine those records with observed play. A popular relic is not automatically overpowered. |
| [Mega Crit's May 2026 developer newsletter](https://www.megacrit.com/news/2026-5-22-neowsletter-issue-22/) explains replacing an overly complex boss, allowing more time between beta changes, and examining character use and win rates by difficulty. | Complexity, update cadence, and cohort differences require deliberate management. | Telegraph boss rules, introduce one new pressure at a time, and compare novices with experienced players separately. Do not import another game's win-rate targets. |

The GDC Vault page redirected to maintenance during a direct re-open; its indexed session abstract and official GDC video description were available. No numerical balancing claims are inferred from unseen slides or an unwatched transcript.

## Player friction worth testing

1. **An impressive late fight can still feel unfair if its rules are unreadable.** In a [2026 Peglin final-boss thread](https://steamcommunity.com/app/1296610/discussions/0/796713775851053265/), players report unclear icons, missing explanations, and builds that dominated earlier rooms failing abruptly. Other replies offer strategy advice and disagree about the encounter. Treat this as a concrete failure mode to test, not proof that difficult bosses are undesirable. PLUMB should show the boss objective and incoming hazard plainly, with more than one viable way to respond.
2. **Spectacle needs controls.** A [Ballionaire screen-shake request](https://steamcommunity.com/app/2667120/discussions/0/591757325740549937/) contains a developer reply confirming a disable option was added in v1.1 on 12 March 2025. It is evidence of a request being addressed, not a claim that the game currently lacks the option. PLUMB already has motion settings; preserve them through all new effects.
3. **Interruption and reliability matter to returning players.** The [Ballionaire discussion index](https://steamcommunity.com/app/2667120/discussions/) currently includes save-during-run, crash, infinite-loop, and device issues. An index is only a set of report titles, not verified diagnoses. Longer expeditions should therefore ship with tested safe-boundary continuation, recovery, and bounded physics resolution. Avoid advertising an untested save/resume capability.

## Recommended design, in delivery order

### 1. Make the player understand and trust the machine

- Teach aim, release, one nudge, and the special ability through a short playable first encounter. Reveal advanced controls when they become relevant. Let players replay or skip instruction.
- Show current shell, remaining interventions, room objective, and the next reward together. Explain failure with an observed cause such as a gutter or spike strike; give the player a specific next experiment.
- Put exact trigger and result in item descriptions. Keep atmospheric prose as a secondary line. Add an inspectable build summary and a glossary for words such as combo, shell, gold, and shatter.
- Make new bosses test a known skill with an announced change. Preview phase transitions, recovery windows, and victory conditions before they matter. Difficulty should not depend on memorizing an unexplained symbol.
- Test boundary collisions, portal loops, slow/stationary balls, high scores, background tabs, resize, touch cancellation, and overlapping controls. Resolve an exhausted or stuck fall clearly without creating a repeatable infinite-score exploit.

### 2. Expand combinations before expanding raw catalogue size

Build three to five readable families around the existing sphere identities: ricochet/combo, precision/multiplier, gravity/portal, shatter/risk, and economy/control. Each family needs an early enabler, a payoff, a recovery tool, and at least one bridge into another family. A bridge should create a new decision, such as spending a nudge to preserve a combo or converting a portal exit into a scoring opportunity.

Items should visibly change what a player tries to do. Test whether players can describe an acquired relic's effect during the next encounter. Do not add many differently named percentage increases merely to raise the content count. Offer selection should mix compatibility with opportunities to pivot; guaranteed perfect synergy every time would remove drafting tension.

Provide a useful skip or alternative resource, avoid offering a one-time upgrade that is already capped, and mark a conditional item whose prerequisite is missing. Later add limited rerolls, replacement, or specialization tools if observed play shows too many dead offers. Do not remove interesting constraints just because a run is imperfect.

### 3. Build a longer adventure from distinct decisions

Use several short sectors with a clear rhythm: encounter, build choice, visible route fork, encounter, service/event, climax. Curate safe and risky routes and validate that every generated route can finish. Board variations should change aiming or resource use, not only peg positions or palette.

Differentiate optional objectives: finish cleanly, reach a marked collector, maintain a chain, break a barrier, or survive a changing gate. State the reward and failure cost before entry. After an initial victory, offer a deliberate cash-out or further descent, with new rules and a clear stopping point. Optional deeper play can serve enthusiasts without making the first successful run exhausting.

Introduce escalating mastery tiers after a win. Prefer a small explained rule change to silently inflated health or speed. Keep easier entry and higher mastery available independently. Treat a proposed normal-run length of roughly 15–25 minutes as a playtest hypothesis, not a genre requirement; measure the actual build first.

### 4. Give players reasons to return that respect their time

- **Discovery:** a collection with honest unlock conditions, discovered interactions, sphere-specific victories, and cosmetic goals. Keep early sphere access generous so experimentation begins quickly.
- **Mastery:** visible best records per sphere and mode, difficulty milestones, and recent run history with route, build, outcome, and retry.
- **Shared problems:** a deterministic daily or weekly expedition with a fixed starting sphere and catalogue. Include a visible date and rules; keep older challenges replayable. Do not punish missed days or require streaks for essential content.
- **Experimentation:** the v0.1 laboratory now supports known boards, preset loadouts, and the last expedition machine. Observe whether players form and test a useful hypothesis before expanding it into a full build editor.

Permanent unlocks should mainly open possibilities. If survival starts weak and only becomes fair after grinding shards, returns can reflect obligation rather than enjoyment. Watch new-profile tests for that distinction.

### 5. Make remarkable runs easy to explain and share

Let the result screen copy a compact challenge/result text containing seed, sphere, mode, difficulty, rules version, and the important achievement. A later image export can include the board, final score, strongest interaction, and a readable game name. Keep the visible playfield readable while large combinations happen: the viewer should see what the player did and what triggered the result.

**Seed contract:** a shared board seed alone is insufficient for identical runs. Fix or encode unlock pools and starting conditions, version route/content rules, and keep independent random streams for boards, offers, and shops. Test the same challenge on a new and an experienced profile. A reproducible input replay additionally needs simulation-version and command-timing guarantees; do not promise it merely because the layout is seeded.

Local records and shareable challenges can ship without an account service. A global leaderboard requires moderation and score validation as well as UI. [Steam's leaderboard documentation](https://partner.steamgames.com/doc/features/leaderboards) distinguishes client-uploaded scores from trusted writes. Do not label an editable local browser score as a verified global result.

## Accessibility and presentation requirements

The [Game Accessibility Guidelines basic reference](https://gameaccessibilityguidelines.com/basic/) recommends configurable controls, readable text, high contrast, redundant visual information, accessible UI input, interactive teaching, saved settings, and difficulty choice. Its [speed guidance](https://gameaccessibilityguidelines.com/include-an-option-to-adjust-the-game-speed/) explains how slower play can help motor timing and information processing. These are design recommendations, not a certification of this build.

For PLUMB, distinguish dangerous, valuable, temporary, and interactive pegs by shape or markings as well as color. Keep the sphere and collision edges visible against decorative light. Preserve shake, particles, and flash settings in every new scene. Offer slower simulation without changing the physics step, and make its score/mode rules clear. Verify keyboard access to every menu and action; test pointer, touch, large text, narrow viewports, and reduced motion separately. Keep sound informative but ensure essential cues have a visual equivalent.

## Audience testing and measurable release gates

These are **proposed internal targets**, not published industry benchmarks. Recruit outside the development team. Start with 12–20 observed players across roguelite enthusiasts, pinball/pachinko fans, and newcomers, including keyboard-only and touch users. Then run a larger invitation playtest of at least 50 players across the intended hardware. Record denominators, build version, mode, prior experience, and whether play was incentivized. Small convenience samples are directional.

| Question | Initial gate to test | Action when it fails |
| --- | --- | --- |
| Does the first minute communicate the game? | At least 80% of fresh players launch unaided within 90 seconds and can explain a nudge after using it. | Rework introduction and control visibility before adding more systems. |
| Do choices feel intentional? | At least 80% can name one reason for their last route or build choice. | Improve consequence previews and remove interchangeable choices. |
| Does a loss teach? | At least 80% correctly explain why their run ended; no unexplained boss rule accounts for repeated novice losses. | Improve telegraphing, feedback, or introductory difficulty. |
| Is there voluntary replay? | Aim for at least 60% choosing another run when explicitly free to stop; observe the next build they pursue. | Diagnose pacing, agency, and discovery rather than adding a login reward. |
| Do players actually return? | Track unprompted next-day and seven-day return among a consenting invitation cohort; compare successive builds and report uncertainty. | Interview returners and non-returners. Do not invent a retention success claim from a handful of testers. |
| Is the game dependable? | Zero known progression blockers or save-loss bugs; 100% pass on a fixed regression-seed set across all spheres and modes. | Hold release and fix the reproducible failures. |
| Is the board readable on target devices? | Required information remains visible at supported sizes; sustained active-play performance meets the declared target on representative low-end hardware. | Profile the real browser, cap effects, and retest the difficult scene. |
| Can someone share the appeal? | Most test viewers of a 15–30 second gameplay clip can explain the player's intervention and resulting payoff. | Improve cause-and-effect feedback and choose a clearer clip. |

Collect offered/selected/skipped items, route choices, loss causes, intervention use, run duration, exit points, and sphere/difficulty outcomes. Prefer local export or explicit playtest consent initially. Report abandonments separately from deaths and completed victories. High win rate can reflect skilled players selecting an item late; pick rate alone cannot establish its strength.

## Release and discovery work after the loop proves itself

Prepare a focused demo that reaches a satisfying first climax and reveals multiple build possibilities. Use audience feedback before committing a major event slot. [Valve's Next Fest documentation](https://partner.steamgames.com/doc/marketing/upcoming_events/nextfest) currently requires an eligible unreleased game, a public store page and playable demo; a title can participate in one Next Fest. It also explicitly says Steam's build review does not replace QA. Recheck the selected edition's dates and eligibility when planning submission.

For a possible Steam release, a Coming Soon page creates a place for demonstrated interest; [Valve's wishlist documentation](https://partner.steamgames.com/doc/marketing/wishlist) describes wishlists and launch/demo notifications. It does not guarantee reach or conversion. Prepare a short gameplay-led trailer, original capsule art, accurate feature claims, a press kit, and a clear creator policy. Measure interest by source and improve the presentation with real audience observations. Publishing, paid campaigns, contacting creators, localization commitments, cloud services, and platform integration remain separate production tasks.

The strongest immediate investment is a replayable, comprehensible, dependable PLUMB that produces stories players can explain: a risky lane chosen, a resource deliberately saved, and a timely intervention turning a failing fall into a remarkable one.

## v0.2: long-term progression and mobile research

Research date: **11 November 2026**. Sources are developer pages, community references, and practitioner articles. Figures recalled from game code rather than a published source are marked.

| Evidence | What it supports | Decision for PLUMB |
| --- | --- | --- |
| Balatro's ante targets grow steeply, and endless antes grow super-exponentially, which works as an honest soft wall ([community reference](https://saschb2b.github.io/game-mechanics/games/balatro/blinds-and-bosses); the endless formula is recalled from code). Its eight stakes are cumulative and unlocked per deck. | Endless depth needs rising pressure and a visible stopping point. | Circuits add stepped, announced pressure (gravity, shell, nudges, Overdrive). The victory screen previews the next circuit. |
| Slay the Spire Ascension and Peglin Cruciball use 20 stacking single-rule levels. StS2 merged its pure stat bumps ([Destructoid](https://www.destructoid.com/all-ascension-levels-in-slay-the-spire-2-and-how-they-work/), [Ludo.guide](https://www.ludo.guide/guide/peglin/getting-started/difficulty-levels-cruciball/cruciball-level-unlocks-effects)). | Each level should change a decision, not only a number. | Trials 7–15 alternate categories: combo, gravity, healing, Overdrive, economy, pegs, payouts, nudges, shell. |
| Hades pays Heat bounties only on the first clear per weapon ([Hades meta reference](https://saschb2b.github.io/game-mechanics/games/hades/meta-progression)). | First-clear rewards prevent farming a shallow difficulty. | Depth bounties pay once per sphere for each new circuit record. |
| Incremental games grow costs geometrically (1.07–1.15 per purchase) and grow prestige with a root of progress ([Kongregate, The Math of Idle Games](https://gamedeveloper.com/design/the-math-of-idle-games-part-i)). | Rewards must grow more slowly than progress, or meta progress collapses. | Stardust follows √score. Endless nodes cost 1.13–1.15^L and approach fixed caps asymptotically. |
| Vampire Survivors lets players refund or disable PowerUps ([guide](https://gamerjournalist.com/vampire-survivors-powerups/)). Permanent stat meta can obsolete a difficulty ladder. | Players need a way to play without meta power. | Star Chart effects are modest, can be turned off for +25% stardust, and never apply to dailies or shared challenges. |
| Ethical retention guidance warns against expiring rewards, escalating streaks, and FOMO ([bugnet](https://bugnet.io/blog/how-to-design-daily-rewards-that-arent-manipulative), [vzbv report](https://www.vzbv.de/sites/default/files/2025-04/25-03-11_Additional_information_vzbv_manipulative_design_online-games.pdf)). | Return incentives should reward play, not punish absence. | Daily and weekly quests pay immediately and carry no streak. Feats and mastery have no expiry. |
| One-handed use is common, and about 75% of touches are by thumb ([Hoober via mobiForge](https://mobiforge.com/design-development/designing-touch-thumb-and-finger-sized-design)). Apple and Material specify minimum targets of 44 pt and 48 dp. | Primary actions belong in the lower screen, sized generously. | Play, controls, and navigation sit low. Touch targets are 44–56 px or more, and keyboard hints are hidden on touch screens. |
| `shadowBlur` cost scales with blurred device-pixel area, and WebKit has reported large frame-rate drops at full DPR ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), [WebKit 230973](https://www2.webkit.org/show_bug.cgi?id=230973)). | Large blurs and full-DPR canvases are the main mobile raster costs. | The full-board shadow is now layered fills. Auto quality lowers DPR relative to the measured refresh baseline, and Battery saver caps it. |
| iOS Safari ignores `navigator.vibrate` ([bugnet](https://bugnet.io/blog/fix-web-game-vibrate-api-not-available-ios-safari)). | Haptics cannot carry essential information. | Vibration is optional, throttled, and always paired with sound and visuals. A Tauri haptics plugin remains future work for iOS. |

Pacing is modeled in `scripts/verify-progression.ts`. In that model, a steadily improving player finishes the capped Star Chart nodes in about 30 runs at rank 10, and the endless nodes keep absorbing stardust after that. This is a model, not a playtest result. Real pacing, difficulty by Trial, and whether quests feel respectful all still need observed play.
