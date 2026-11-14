/**
 * Persian (فارسی) dictionary, merged from one file per layer so each area of the game can be
 * translated independently. Keys are the exact English source strings passed to `t()`.
 *
 * Glossary: keep these terms consistent everywhere.
 *   sphere گوی · shell پوسته · gears چرخ‌دنده · score امتیاز · multiplier ضریب · combo کمبو
 *   nudge تلنگر · tilt شیب · gate دریچه · Overdrive اوردرایو · reactor رآکتور
 *   peg میخ · gold peg میخ طلایی · bumper ضربه‌گیر · spring فنر · spike خار · gutter ناودان
 *   pocket / collector جیب · safe pocket جیب امن · portal درگاه · gravity well چاه گرانش
 *   accelerator شتاب‌دهنده · shutter کرکره · jackpot جک‌پات · maw دهانه
 *   the Grinder آسیاب · core هسته · seal مهر · machine ماشین · board صفحه · the Helix مارپیچ
 *   drop / fall سقوط · release رها کردن · aim نشانه‌گیری · relic یادگار · upgrade ارتقا
 *   synergy / resonance هم‌نوایی · tag برچسب · anomaly ناهنجاری · expedition سفر · run دور
 *   Trial آزمون · circuit مدار · act پرده · stardust غبار ستاره · shard خرده‌بلور
 *   Star Chart نقشهٔ ستارگان · quest مأموریت · feat دستاورد · rank رتبه · XP XP
 *   mastery تسلط · finish (cosmetic) پوشش · title عنوان · daily constellation صورت فلکی روزانه
 *   practice تمرین · laboratory آزمایشگاه · archive بایگانی · logbook دفترچهٔ سفر · journal دفتر
 *   commission سفارش · guardian نگهبان · Bellkeeper ناقوس‌بان · Heartforge قلب‌کوره · relay رله
 *   bounty جایزه · shop فروشگاه · reroll تعویض · mend ترمیم · bench نیمکت · bargain معامله
 *   seed بذر · workshop کارگاه · schematic نقشه · research پژوهش · safe امن · risky پرخطر
 *   Rubber Heart قلب لاستیکی · Prism Core هستهٔ منشوری · Void Marble تیلهٔ تهی
 * Tags: bounce جهش · multiplier ضریب · gravity گرانش · control کنترل · economy اقتصاد · risk ریسک
 *   portal درگاه · destruction تخریب · combo کمبو · precision دقت · luck شانس · magnet آهنربا
 *
 * Keep brand names, key names (A, D, E, Q, F, V, J, Enter, Esc, Space) and ×/numbers as they are.
 * Use a zero-width non-joiner (U+200C, ‌) where Persian needs one: می‌شود, چرخ‌دنده.
 */
import type { Dictionary } from '../index'
import { content } from './content'
import { game } from './game'
import { sim } from './sim'
import { ui } from './ui'

const core: Dictionary = {
  'PLUMB': 'PLUMB',
  'A cosmic pachinko roguelite. Aim, nudge and bend the fall through a living machine.': 'یک روگلایت پاچینکوی کیهانی. نشانه بگیر، تلنگر بزن و سقوط را در دل ماشینی زنده خم کن.',
  'The Helix is stuck': 'مارپیچ گیر کرده است',
  'The machine failed to start.': 'ماشین روشن نشد.',
  'Language': 'زبان',
}

export const fa: Dictionary = { ...core, ...content, ...sim, ...game, ...ui }
