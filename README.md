# PLUMB

A pachinko roguelite. The sphere falls through a living machine. You cannot hold it. You can still decide the fall.

## Languages

PLUMB plays in **Persian (فارسی)** by default and in **English**. Switch in Settings → Language; the choice is remembered on the device, and `?lang=en` or `?lang=fa` overrides it for one visit. Persian lays the interface out right to left with the bundled Vazirmatn font (OFL, offline), while the machine and the physical controls (nudge left stays on the left) are never mirrored.

- English is the source language. Every visible string passes through `t()` from `src/i18n`, which looks it up in the active dictionary and falls back to English. Placeholders use `{name}`.
- Persian dictionaries live in `src/i18n/fa/`, one file per layer (content, sim, game, ui), with a shared glossary in `src/i18n/fa/index.ts`.
- To add a language, add a dictionary folder and register it in `LOCALES` and `DICTS` in `src/i18n/index.ts`.
- `npm run verify:i18n` fails when a literal `t()` key has no Persian entry, when placeholders differ from the English, or when two dictionaries disagree. Headless checks and the existing browser tests run in English.

## Blast pegs, a living score, targets with teeth · v0.7

Simulated play showed the score target had stopped mattering: a deliberate player landed short of it once in 26 machines, so the meter was decoration and Overdrive's rescue had no job. This version restores that tension, gives each fall a bigger moment to aim for, and puts music under all of it.

- **Targets with teeth:** targets now grow by half their base per machine of depth instead of a third, with layout bases refitted from about 1,000 simulated falls (`src/game/target.ts`). A deliberate player (aims with the preview, nudges away from hazards, saves Overdrive for a short fall) now misses about one machine in eleven and wins Trial 0 a little over half the time; a careless release misses about one in six and wins about one expedition in five. Void Marble, which bounces less, gets targets 10% lower so each sphere misses about as often. The first machine stays gentle.
- **Blast pegs (rules 4):** an ember-cored peg that detonates when struck. Every peg within its reach pays as if hit (gold still raises the multiplier), blast pegs inside the reach chain, and the sphere is thrown clear. One blast per Act I machine, two from the Foundry on, one more per circuit, never on the Grinder. A dashed ring shows the reach, the aim preview calls out a **blast contact**, and Arc Coil lightning lights the fuse. Lit pegs are not physical contacts, so blasts never charge Overdrive by themselves.
- **Three new schematics:** **Powder Heart** (blasts reach 45% farther and add +0.2 multiplier), **Chain Reactor** (each detonation adds 40% Overdrive charge) and **Tinder Box** (two more blast pegs in every machine). They join the end of the research order.
- **Demolition feat:** detonate 10, 25, 63… blast pegs for stardust.
- **Adaptive music:** a generative score (`src/audio/music.ts`) with its own volume slider. The home screen is a music box, aiming holds a pulse, a fall grooves harder as the chain and multiplier grow, Overdrive opens the filter, a fall heading home short drops to a ticking clock, and the Grinder turns minor. It is synthesized, offline, and in the same key as the peg bells.
- **Supercharged lap:** after reaching three times the target, the sphere trails a prismatic tail and the music lifts for the rest of the fall.
- **Route rail:** decision rooms and the desktop machine panel show every station from the Workshop to the Grinder, with the current machine lit.
- **Fixes:** struck pegs no longer stay displaced from their sockets on slow frames (the recoil spring now runs in fixed substeps); the aiming hint no longer truncates (“Miss it: −1 shell”).
- **Compatibility:** new expeditions use **rules 4**. Rules 2 and 3 challenge links, checkpoints and logbook replays rebuild their machines without blast pegs, and daily bests are kept per rules version. The 42-fall physics fingerprint still matches once the three new relics are left out, which shows that no earlier physics moved.

## Fewer scrolls, fuller Persian · v0.6

The interface was rebuilt around one rule: a phone screen should hold the whole decision.

- **One-screen phone layouts:** the hub, settings, archive, quests, research, the laboratory, relic drafts, shops, events, forks and every decision room fit a 393 × 851 phone without scrolling, and the hub sheds ornaments (tagline, finish row, tags) on shorter phones instead of scrolling. On desktop no screen scrolls at 1440 × 900.
- **Tabs instead of long pages:** the Archive (spheres, relics, parts, challenges, fragments), Quests (today, this week, feats) and the run journal (build, guardian or commissions, route) use a segmented tab bar with found/complete counts. Undiscovered archive entries fold into a few grouped hint rows. The journal measured 4,556 px on a phone before; a tab is now about one screen.
- **Research screen:** shard research and the run seed moved off the hub into their own screen (bottom bar → Research, with a badge when a schematic is affordable). A custom seed shows on the Play button.
- **Compact cards:** offers put the description under a short header, so three relics fit a phone; on wide screens drafts and shops deal a hand of tall cards with aligned actions. The run summary puts rank progress and actions above the fold; the fall analysis folds on phones and sits beside the summary on desktop. Feat tiers climbed in one run merge into one line, and long news lists fold rather than scroll inside the page.
- **Persian everywhere:** numbers use Persian digits (۱۲٬۳۴۵, ۱٫۵, ۲۰٪) in the interface and on the machine itself; seeds and key names keep their Latin form. XP reads تجربه and Space reads فاصله. Missing Persian entries for every new string are covered by `verify:i18n`.
- **Readable glass on phones:** score popups, the chain readout and collector names scale up when a phone draws the machine at half size. The machine's title card sits mid-board, clear of the launcher, and steps aside as soon as you aim. Live notices on phones are a slim banner.
- **Celebration:** confetti for victories, new bests, rank-ups, schematic reveals and overcharged landings (off with reduced motion).
- **Balance:** the Workshop (32), Garden (40) and Ante (62) targets were lowered after simulated play showed careless releases missing the first machine one time in five and the Ante one time in four. Prism Core keeps its two-shell fragility but nudges 20% harder; simulated skilled play raised its Grinder core strikes from 3.7 to 4.5 and its win rate from about 25% to 33%.

## Targets and gears · v0.5

Every fall now answers one question: **did you power the machine?**

- **Score target:** each machine shows a target before release, in a title card and in the always-visible target meter. Peg, bumper, spring and relic payouts are **points**; reach the target in one fall to power the machine. Doubling and tripling it **overcharges** for extra gears. Landing safely short of it costs **one shell**. A gutter already costs shell, so it is never charged twice, and a target met before a gutter still pays. The Grinder has no score target; its meter tracks the five core seals instead.
- **Overdrive has a job:** when a fall heads home short, the meter turns red, a single warning sounds, and the reactor control pulses. Firing it lifts the sphere back into the pegs for the points it still needs.
- **Gears are a calm currency:** points no longer double as money. Gears come from landing pockets, powered and overcharged machines, guardian bounties (25 and 40), commissions, salvage from calm machines without a draft, and events. Shop prices (30 per upgrade, 50 per relic, +45% per act), repairs, bargains and events were rescaled so a careful act buys one or two parts, never the whole counter.
- **Targets follow pressure:** a target grows with the machine's depth, layout, Trial and circuit, and ignores Star Chart yield, so permanent upgrades make targets easier. Values were fitted with simulated expeditions (`src/game/target.ts`): careless releases miss about one target in four, deliberate play rarely does. A human-like simulated player wins Trial 0 a little more than half the time, about a quarter of the time at Trial 6, and rarely at Trial 15.
- **Choosing a path:** fork cards show the next machine's target and what surviving it pays, and each machine's title card repeats its reward, so risk is weighed with real numbers.
- **Reading the result:** each landing shows the fall's score against its target and an itemised gear ledger (pocket, target bonus, overcharge, bounty, commission, salvage). Gears fly from the landing into the wallet.
- **Presentation:** machines slide in with a title card (act, name, target, anomaly). Struck pegs recoil on springs, score popups pop and glow with the chain, and target, overcharge and shortfall each have their own burst, sound and haptic cue. Decision rooms keep shell, gears and score visible. The desktop hub is a two-column showcase and play desk; run results put Play again above the fold.

`npm run verify:builds` covers the target rules: one announcement, two overcharge tiers, flat gear payouts, exactly one shell for a short landing, no double charge on gutters, no target on the Grinder, and targets that rise with depth, Trial and circuit.

## The long game · v0.2

PLUMB now rewards every expedition, keeps difficulty rising without a ceiling, and treats the phone as the primary device.

**Progression that does not run out**

- **Rank:** every finished expedition earns XP from machines survived, score, wins, and circuits. Levels follow a polynomial curve (100 · L^1.5 XP per level), so they slow down but never wall. Each level pays stardust, and every five levels grants a new title.
- **Star Chart:** spend stardust on thirteen permanent upgrades. Ten are capped and modest (starting gears, +1 nudge, +1 shell, cheaper shops, free rerolls, a fourth starting relic, and others). Three are endless with asymptotic effects: board payouts approach +30%, XP approaches +50%, and stardust income approaches +50%. Costs grow geometrically. A toggle switches to purist expeditions that ignore the chart and pay +25% stardust.
- **Fair comparisons:** daily constellations and shared challenge links always use pure rules, so a seed rebuilds the same machine on every profile.
- **Sphere mastery:** each sphere levels from the same XP. Seven cosmetic finishes per sphere unlock at mastery 1, 3, 6, 10, 15, 22, and 30. Finishes change colors only; physics never reads them.
- **Quests:** three daily and two weekly goals, seeded by the UTC date. They count expeditions and dailies (never practice) and pay the moment they complete. Missing a day costs nothing.
- **Feats:** eleven lifetime milestones with endless geometric tiers, such as pegs struck, jackpots, Grinder wins, best combo, and depth.
- **Win stickers:** the Archive marks the highest Trial at which each relic was part of a winning build.

**Deeper difficulty**

- **Trials 7–15:** each adds one rule: a shorter combo window, heavier gravity, thin benches, a single Overdrive, a tight purse, restless pegs, cold collectors, fewer nudges, and Eclipse.
- **Endless circuits:** gravity keeps rising up to a cap. Circuit 3 removes a maximum shell, circuit 6 a nudge, and circuit 9 limits you to one Overdrive. The victory screen previews the next circuit's pressure. A new depth record pays a one-time stardust bounty per sphere, so shallow circuits cannot be farmed.

**Mobile first**

- **Game UI:** the whole presentation layer was rebuilt as one stylesheet (`src/game.css`) with bundled Lilita One and Fredoka fonts (OFL, offline). It uses chunky 3D buttons, outlined display type, tone-coded relic cards with icon gems, side-by-side safe and risky path cards, celebratory result and victory modals, and icon-first navigation. The home screen fits on one phone screen: rank, wallets, a floating sphere with a picker and finishes, Trial selector, a large Play button, Daily / Quests / Star Chart / Practice tiles, and a sticky bottom bar.
- **Playfield:** the phone HUD has two compact header rows (shell, gears, multiplier, journal, pause, machine name and status) above the board, and color-coded thumb controls below it, with Overdrive in the center. Desktop keeps side docks beside the machine. Board palettes are brighter, and engraved micro-text was removed from the cabinet.
- **Touch:** controls are at least 56 px tall, keyboard hints are hidden on touch screens, and on-screen copy describes touch input. Safe-area insets cover notches and home indicators. Pinch and double-tap zoom are suppressed, and so is pull-to-refresh.
- **Haptics:** cues are throttled, can be toggled, and work on Android browsers and the Android app. iOS Safari ignores vibration, so every cue also has a sound and a visual.
- **Performance:** the Auto graphics setting lowers canvas resolution when frames run long. Battery saver caps resolution and halves the menu frame rate. The full-board 50 px canvas shadow and the hub specimen's shadowed canvas render have been replaced. HUD backdrop blur is removed during play.
- **Installable:** a web manifest and an offline service worker (production HTTPS only) let the web build run from the home screen.

`npm run verify:progression` checks the curves, caps, quest seeding, feat tiers, and a pacing model. The expedition suite adds checks for Star Chart purity, purchases, high Trials, reward granting, one-time depth bounties, quests, and finishes.

## Read the fall · v0.1

Open **Practice laboratory** from the hub to practice eight machines, including both guardians and the Grinder. Try any of the three spheres with a stock, control, or Arc & Rudder loadout. The machine stays seeded between attempts, controls retain their normal finite reserves, and results compare your gears with the previous attempt and session best. Practice preserves your saved expedition and archive; its scores and unlocks do not enter progression.

The final fall of a completed expedition now has a **fall analysis**: the actual landing or loss, shell damage with timestamps, peak combo, time, and accepted control usage. Refunds do not hide an intervention, blocked inputs do not count as uses, and shields do not become false damage. Advice refers to the observed objective and remaining controls.

Choose **Practice the last machine** from that analysis to repeat its exact board, sphere, installed build, starting shell, trial, circuit, and rules version. Changing a selector returns to a standard practice setup. Session comparisons reset when the setup changes, and practice results disappear on reload. An abandoned live fall is not labeled as a death or given a fabricated completed-fall analysis.

## Relay guardians · v0.4

Two optional physical objectives now change the problem inside existing machines:

- **The Bellkeeper**, in Act I's gallery or kiln, asks you to strike three bells in any order. Credited bells retract. Linking all three pays **25 gears** and opens a relic draft if you survive. The riskier kiln retains its guaranteed surviving relic even when the bells are unfinished; completion adds the gear bounty, rather than a second relic.
- **The Heartforge**, in Act II's dynamo, asks for **I → II → I → II** across its left and right relays. Completing the sequence pays **40 gears** and opens a relic draft if you survive. The HUD shows the next valid target.

An unfinished guardian allows **one automatic return from a safe collector before 75 seconds of simulation time**. Progress, shell, earned gears, and remaining controls carry over; the return awards no landing payout and restores no resources. Hazard gutters still follow normal damage rules and cannot trigger this return, even when shielded. After the return is spent, its time window expires, or the objective is completed, collectors settle normally. An incomplete guardian never blocks normal route progression if you survive.

Fresh profiles receive contextual **Workshop tips** for release, nudging, and Overdrive. The relevant controls light up as the situation changes; completing a real nudge and an Overdrive activation finishes the coaching. Dismiss tips at any time, or choose **Show Workshop tips again** in How to play. This returns to the hub while preserving the expedition checkpoint. Guardian instructions, credited targets, bounty, and remaining return stay visible during play; the journal explains the complete contract. Live notices sit at the edge of the playfield.

Feedback keeps the sphere visible: first-contact labels avoid the launcher, nearby payout labels are capped, and the persistent chain readout replaces competing combo and lightning captions. Phone guardian completion and reactor readiness use their existing HUD instruments, leaving collectors visible. Nudge, trick, and tilt buttons now reflect their brief recovery periods as well as remaining charges.

New expeditions and dailies use **rules 3**. Rules 2 challenge links, checkpoints, and logbook replays keep their original routes without relay guardians. Imported rules 2 challenges are labeled **Classic route**; daily personal bests are kept separately by rules version.

The presentation has been rebuilt around an orbital specimen display, a dedicated expedition console, illustrated schematic cards, and a connected constellation route. Machines have distinct conservatory, foundry, gravity, and boss architecture, a first-contact aim marker, clearer sphere trails, live chain timing, and a five-seal boss display.

**Overdrive adds a decision during every fall.** Five different physical peg contacts charge the reactor. Press **E** or its on-screen control for an aimed upward pulse, three seconds of doubled collision earnings, and held combo decay. You get two activations per machine. Hazards still hurt, and landing/relic payouts are not doubled.

The Helix unfolds over **three acts and 10–11 machines**, with seven route forks, three choice events, shops, and full shell repairs between acts. Choose a starting relic and build from **18 relics and 14 upgrades**. Six seeded anomalies change the physical boards: extra gold, vanishing constellations, springs, gravity wells, reinforced pegs, and moving tracks.

New relic engines include capped lightning discharges, one-hit protection, timely gold-hit nudge recovery, reinvesting earned gears, alternating springs and bumpers, portal rewards, clean landings, and shatter-driven repairs. The journal explains the actual bonuses of matching tags and shows every acquired item.

- **Commissions:** three seeded goals pay gears, mend one shell when you survive the drop, and award four shards each at expedition end.
- **Trials:** clearing the Grinder unlocks the next cumulative difficulty for that sphere, up to Trial 6. Select an unlocked trial at the hub; its rule is explained before starting.
- **Circuits:** bank a boss victory or keep your build, fully repair, choose another relic, and enter another three-act circuit. Gravity, anomaly intensity/frequency, payouts, and shop prices increase within bounded limits. Cleared circuits still count toward mastery and challenges if a later circuit ends in defeat.
- **Daily constellation:** a UTC-date seed with a fixed sphere and complete research catalogue. Replay freely; bests are local to this device. There is no online leaderboard or streak penalty.
- **Sharing:** challenge links include the rules version, seed, sphere, trial, mode, and captured research catalogue. Follow the same choices in the same version to reproduce a challenge across fresh and veteran profiles. Bare seeds reproduce boards; they do not encode a build or player inputs.
- **Continue:** decisions save automatically. Reloading during a fall restarts the current machine from its launch state. Purchases and rerolls persist. Starting another expedition replaces the saved one. The logbook keeps the last 20 completed expeditions.

The Grinder still needs five real core strikes. A missed pocket now spends one shell and returns the sphere with core progress intact. Finite lives and stalled-drop recovery keep a fight from continuing indefinitely. Void Marble's Space ability now uses its tilt pool correctly.

Research and the implementation direction are documented in [the genre evidence brief](docs/genre-research.md) and [the design and validation notes](docs/expedition-design.md).

## Play

```bash
npm install
npm run dev
```

Open the local URL Vite prints. `npm run build` typechecks and writes `dist/`.

Use a currently supported Node.js LTS release. The test harness uses Happy DOM and native Canvas; these are development dependencies and are not shipped in the game bundle.

## Desktop and mobile apps

The same web build ships as a native app through [Tauri 2](https://tauri.app). The shell in `src-tauri/` only hosts the game in the system webview (WebView2 on Windows, WKWebView on macOS and iOS, WebKitGTK on Linux, Android System WebView); it needs no native APIs. Install [Rust](https://rustup.rs) and the [platform prerequisites](https://tauri.app/start/prerequisites/) first.

```bash
npm run app:dev     # native window with Vite hot reload
npm run app:build   # installers in src-tauri/target/release/bundle/
```

On Windows this produces an NSIS installer and an MSI; on macOS a `.app` and `.dmg`; on Linux `.deb`, `.rpm`, and an AppImage. Each platform builds its own bundles, so use the **Desktop apps** workflow for all three: run it manually, or push a `v*` tag to also attach the bundles to a draft GitHub release. Builds are unsigned until signing certificates are configured.

For phones, run `npm run tauri android init` or `npm run tauri ios init` once (Android SDK/NDK or Xcode required), then `npm run tauri android dev` / `npm run tauri ios dev`. The app icon source is `src-tauri/app-icon.svg`; regenerate every size with `npm run tauri icon src-tauri/app-icon.svg`.

Saves and the expedition checkpoint live in the app's own webview storage, separate from the browser version. Challenge links copied in the app point to https://plumb.bazimazi.games so others can open them.

The Helix is presented as a celestial arcade: an animated astrolabe on the title screen, engraved machines in four color palettes, glass sphere materials, illuminated collectors, and ricochet effects. The selected sphere changes the title specimen. Phone layouts reserve space above and below the playfield for the controls; system reduced-motion preferences quiet ambient animation, camera shake, zoom, particles, and flashes.

## Visual verification

```bash
npm test
npm run verify:visuals
npm run verify:browser
```

`npm test` checks relic mechanics and accounting, Overdrive, guardian contacts and finite returns, factual reports, generated routes and anomalous physics, and DOM/controller flows including full expeditions and isolated practice with every sphere. Each suite can also be run through `verify:builds`, `verify:momentum`, `verify:encounters`, `verify:reports`, `verify:routes`, or `verify:expeditions`. These tests are deterministic and run offline.

`npm run verify:browser` runs Playwright in desktop Chromium, touch-emulated phone/tablet Chromium, and desktop Firefox. It tests real clicks and taps, seeded physical charging, guardian progress and earned relic drafts, Workshop coaching, classic challenge compatibility, pause/resume, checkpoints, decision screens, large type, reduced motion, cooldowns, and layout fit. Laboratory checks add real falls, identical retries, complete storage preservation, locked-sphere practice, calibration scroll/focus, factual reports, matched last-machine replay, and voluntary abandonment without a fabricated death report. It writes screenshots to `artifacts/browser/` and an HTML report to `artifacts/playwright-report/`. Run `npx playwright install chromium firefox` once if the required browsers are not installed. Mobile emulation complements physical-device testing. The v0.1 run passes all **56 browser scenarios**; the production build, 35 expedition integration checks, 15 report checks, 12 guardian checks across 720 falls, and 112 Canvas renders also pass.

Set `PLUMB_TEST_LIGHT=1` when memory is constrained to omit trace and video recording. Screenshots, browser profiles, and assertions stay the same.

`npm run verify:visuals` uses a native Canvas implementation, without launching a browser. It simulates all seven layouts with all three spheres, checks that rendering does not mutate gameplay, exercises animated and still title scenes at desktop and high-DPI phone sizes, and writes PNGs to `artifacts/visual-checks/`. These checks complement browser playtesting; they do not verify CSS layout or browser-specific rendering.

## A fall

- Aim with the mouse or the arrow keys. Click or press Enter to release. Launch weight is fixed.
- **V** inspects the whole machine before launch; press again to return to the inlet. Releasing the sphere restores the tracking camera.
- **A / D** nudge. You only get a few.
- **F** flips the gate once.
- **E** triggers charged Overdrive. Choose between saving a line and maximizing three seconds of collision earnings.
- **Space** uses the sphere's trick: Rebound, Mark, or Tilt.
- **Q** leans gravity, once a build has learned it.
- **J** opens the build, commissions, and route journal; the machine pauses while you read.
- **Esc** pauses. Settings offer 0.75×, 1×, 1.5×, or 2× pacing, motion controls, and larger text. Hidden tabs pause automatically.
- Every machine has a score target. Reach it in one fall or lose a shell; double or triple it for bonus gears.
- Gold raises the multiplier. Gutters, spikes and missed targets crack the shell. An empty shell ends the fall.
- Shards stay. They study schematics, which add relics to future falls.

Rubber Heart is awake at the start. Prism Core wakes after the first fall. Void Marble wakes when you reach the Gravity Core, or after two falls.

Every fall has a seed. Share a complete challenge from its results or logbook, or retry it with the same captured catalogue.

`` ` `` opens the developer panel in dev builds.
