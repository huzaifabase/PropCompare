-- PropCompare learn-article seed: 10 original educational articles.
-- Rules honored: no firm-specific numeric claims; hypothetical examples are
-- explicitly labeled as hypothetical; no ratings, testimonials, or invented data.

insert into public.articles
  (category_id, slug, title, excerpt, content_md, status, author, meta_title, meta_description, published_at)
values
(
  (select id from public.article_categories where slug = 'guides'),
  'what-is-a-prop-trading-firm',
  'What Is a Prop Trading Firm?',
  $$A prop trading firm lets you trade its capital after you prove yourself in a paid evaluation. Here is how the model actually works — and what you're really buying.$$,
  $$## The basic idea

A proprietary ("prop") trading firm gives traders access to trading capital without requiring them to risk their own savings. Instead of depositing tens of thousands of dollars with a broker, you pay a one-time evaluation fee and trade a simulated account under the firm's rules. Pass the evaluation and the firm lets you trade a larger simulated account, sharing a percentage of the profits with you.

The key word is **simulated**. In almost all retail prop firm programs, you never touch live market capital. Your trades are mirrored or simply tracked on a demo server, and payouts come from the firm's own revenue — largely funded by the evaluation fees of traders who don't pass.

## The typical journey

1. **Choose a challenge.** You pick an account size and an evaluation type (one-step, two-step, or instant funding).
2. **Pay the fee.** This is the firm's revenue. It is usually non-refundable if you fail or breach a rule.
3. **Trade the evaluation.** You must hit a profit target without breaking rules like the daily drawdown limit or maximum drawdown.
4. **Get "funded."** Pass, and you receive a funded account with a profit split — for example, you keep a majority share of the simulated profits you generate.
5. **Request payouts.** Profits can be withdrawn on the firm's schedule, subject to its payout policy and minimums.

## What you're really buying

You are not buying capital. You are buying **an opportunity with strict conditions**: a defined rulebook, a time-boxed or open-ended trial, and a payout policy the firm can change. The fee purchases the attempt, not the funding.

That framing matters because it changes how you should evaluate an offer. A cheap challenge with brutal rules can be a worse deal than a pricier one with terms that fit your strategy. Always read the full rulebook — drawdown type, news trading policy, weekend holding, payout conditions — before paying.

## Is it legitimate?

The model itself is legitimate: firms profit when skilled traders generate simulated profits they share, and from fees overall. But the space has real risks — firms can change terms, delay payouts, or shut down. Treat every firm as guilty until proven innocent: check how long it has operated, read its terms carefully, and never pay a fee you can't afford to lose outright.

**Bottom line:** a prop firm sells you a structured shot at trading larger size. Understand the rules better than the marketing, and you'll avoid the most common expensive surprises.$$,
  'published',
  'PropCompare Research Team',
  $$What Is a Prop Trading Firm? How Evaluations Work | PropCompare$$,
  $$A plain-language explainer: how prop trading firms work, what an evaluation challenge really buys you, and the risks to understand first.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'comparisons'),
  'one-step-vs-two-step-challenges',
  'One-Step vs Two-Step Challenges: Which Evaluation Fits You?',
  $$One-step and two-step evaluations test the same skills under different pressure. Here's how the trade-offs work so you can pick the format that matches your trading style.$$,
  $$## What the steps mean

A **one-step challenge** has a single evaluation phase: hit the profit target once without breaking the rules, and you're funded. A **two-step challenge** splits the trial into two phases — typically a larger target in phase one and a smaller one in phase two — each with its own rules.

Some firms also offer three-step evaluations or "instant funding" with no evaluation phase at all (usually with tighter ongoing rules and a higher fee).

## The core trade-off

Fewer steps means less total profit to prove but **more pressure per trade**. In a one-step challenge, every drawdown hurts because there is no second phase to recover in — one bad week can end the attempt. Two-step challenges spread the target across phases, which gives patient traders room to breathe, but they take longer and each phase is another chance to breach a rule.

Think of it this way: one-step favors traders who can perform in short, focused bursts. Two-step favors traders whose edge plays out over dozens of trades and who prefer lower daily intensity.

## What usually differs between the formats

- **Profit targets:** two-step programs often set a higher phase-one target and a lower phase-two target; one-step programs set a single target somewhere in between. (Exact figures vary by firm and change often — always check the current terms.)
- **Time pressure:** one-step challenges sometimes carry minimum trading days just like two-step ones, but psychologically the single phase feels faster.
- **Fees:** one-step challenges are frequently priced higher than two-step challenges at the same account size, because the firm takes on the funding decision sooner.
- **Rule strictness:** the drawdown limits, news rules, and consistency requirements can differ between formats at the same firm — never assume one format's rules apply to the other.

## How to choose

Match the format to your **verified trading behavior**, not your aspirations:

- If your journal shows you hit targets in concentrated winning streaks but struggle with patience, one-step may suit you.
- If your edge needs 30–50 trades to materialize and you trade best with modest daily risk, two-step is usually kinder.
- If you hate evaluations entirely, instant funding removes the trial but typically pairs it with the tightest drawdown rules and no refund on breach — read those terms twice.

**Bottom line:** neither format is objectively easier. The right choice is the one whose pressure profile matches how you already trade profitably on demo. Mismatching format to style is one of the most common reasons traders fail evaluations they had the skill to pass.$$,
  'published',
  'PropCompare Research Team',
  $$One-Step vs Two-Step Prop Firm Challenges Compared | PropCompare$$,
  $$One-step vs two-step evaluations: how the formats differ in pressure, targets, fees, and fit — and how to choose based on your trading style.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'guides'),
  'how-daily-drawdown-works',
  'How Daily Drawdown Works (and Why It Ends Most Evaluations)',
  $$The daily drawdown limit is the single rule that ends the most challenges. Learn exactly how it's calculated — and the mistakes that trigger it — before you pay a fee.$$,
  $$## What it is

The **daily drawdown limit** caps how much your account equity can fall within a single trading day. Breach it — even for a moment — and most firms terminate the challenge immediately with no refund. It is a hard rule, not a warning.

For example, with a hypothetical 5% daily limit on a hypothetical $100,000 account, your equity must not drop more than a hypothetical $5,000 below the day's starting point at any moment during the day.

## How the "day" is defined

This is where traders get caught. Firms define the trading day differently:

- **Rolling 24 hours** from a fixed server time (commonly midnight server time, which may not match your timezone).
- **Calendar day** in the server's timezone.
- Some firms reset based on your **balance at the reset time**; others use the **higher of balance or equity**.

The practical consequence: a position held through the reset can count against the new day. Always confirm the reset time and the reference point in the firm's official rules.

## Balance vs. equity — the killer detail

Many firms calculate daily drawdown on **equity** (balance plus open profit/loss), not just closed balance. That means a trade that is deeply underwater intraday can breach the limit even if you eventually close it for a profit. The breach is evaluated tick by tick.

Example with hypothetical numbers: your day starts at a hypothetical $100,000 balance. You open a trade that drops to a hypothetical -$6,000 unrealized against a hypothetical 5% ($5,000) daily limit, then recovers to close at +$1,000. Your closed balance looks fine — but the intraday equity dip already breached the rule, and the challenge is over.

## Common ways traders breach it

1. **Oversized positions after a loss** — revenge trading into the same drawdown that was already close to the limit.
2. **Holding through the daily reset** — the reference point moves and yesterday's cushion disappears.
3. **News spikes** — a fast move against an open position blows through the intraday equity threshold in seconds.
4. **Stacking correlated trades** — three positions on correlated pairs are effectively one triple-sized position against the limit.

## How to stay safe

Risk a small fraction of the daily allowance per trade — many passing traders risk no more than roughly a quarter to a third of the daily limit on any single position. Know your reset time, monitor equity (not just balance), and flatten or reduce exposure before high-impact news if your strategy isn't built for it.

**Bottom line:** the daily drawdown is a intraday equity tripwire. Respect it as the binding constraint on your position sizing, and most "unfair breach" stories become avoidable math.$$,
  'published',
  'PropCompare Research Team',
  $$How Daily Drawdown Works in Prop Firm Challenges | PropCompare$$,
  $$Daily drawdown explained: how firms calculate it, why equity (not balance) matters, and the four mistakes that breach it most often.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'guides'),
  'static-vs-trailing-drawdown',
  'Static vs Trailing Drawdown: The Difference That Changes Everything',
  $$Static and trailing drawdowns sound similar but punish completely different behaviors. Understand which one you're signing up for before it signs you out.$$,
  $$## The two models

Every prop firm sets a **maximum drawdown** — the total loss from peak that ends your challenge. How that peak is measured defines the model:

- **Static drawdown:** the limit is anchored to your **starting balance**. It never moves up, no matter how much profit you make.
- **Trailing drawdown:** the limit **trails your highest equity or balance**. As your peak rises, the floor rises with it.

## A hypothetical walkthrough

Imagine a hypothetical $100,000 account with a hypothetical 10% maximum drawdown.

**Static:** your floor is a hypothetical $90,000 from day one and stays there. Grow the account to a hypothetical $110,000 and you now have a hypothetical $20,000 cushion. Every dollar of profit permanently increases your breathing room.

**Trailing:** the floor starts at a hypothetical $90,000 too. But when your equity peaks at a hypothetical $105,000, the floor trails up to a hypothetical $95,000. If you then give back profits and equity falls to a hypothetical $94,999, you've breached — even though you're still above your starting balance.

Trailing drawdowns typically stop trailing once you've built enough cushion (the trail "locks" at or above the starting balance), but the exact lock behavior varies by firm.

## Why it matters for your strategy

The two models punish opposite mistakes:

- **Static** punishes **early losses**. Lose 8% in week one and you spend the rest of the challenge with a 2% lifeline. But it rewards winners: profits bank permanent safety.
- **Trailing** punishes **giving back profits**. A strategy that grinds up 6% then suffers normal pullbacks can breach on the retracement — the classic "I was up and still failed" story.

Trend followers and runners of large open profits often prefer static, because their style banks cushion. Scalpers and mean-reversion traders who frequently give back open gains need to be far more careful under trailing rules.

## Questions to ask before you buy

1. Is the maximum drawdown static or trailing?
2. Does the trail follow **balance or equity**? (Equity-based trailing is stricter — intraday spikes move the peak.)
3. At what point does the trail lock, if ever?
4. Is the daily drawdown calculated the same way as the maximum?

Firms don't always explain this clearly on marketing pages. The answers are usually in the FAQ or terms — find them before paying, because this single setting determines which strategies can survive the challenge.

**Bottom line:** static drawdown rewards banking profits; trailing drawdown punishes surrendering them. Pick the model your strategy already respects, or adapt your profit-taking before you start.$$,
  'published',
  'PropCompare Research Team',
  $$Static vs Trailing Drawdown in Prop Challenges | PropCompare$$,
  $$Static vs trailing max drawdown explained with hypothetical examples: how each model works, which strategies each favors, and what to verify first.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'guides'),
  'understanding-profit-targets',
  'Understanding Profit Targets: Hitting the Number Without Blowing Up',
  $$Profit targets look like the easy part of a challenge — until the math of drawdown limits meets the psychology of a deadline. Here's how to think about them clearly.$$,
  $$## What a profit target is

The **profit target** is the gain you must achieve to pass an evaluation phase — expressed as a percentage of the starting account balance. Hit it without breaking any rule and you advance (or get funded). Miss it, and the attempt ends when time or rules run out.

Targets differ by phase: in two-step challenges, phase one usually demands more than phase two. Firms publish these as percentages; the dollar value scales with account size.

## The hidden equation: target vs. drawdown

The target never exists alone — it exists **relative to your drawdown limits**. That ratio is the real difficulty setting of the challenge.

Consider two hypothetical challenges, both with a hypothetical 10% profit target:

- Challenge A allows a hypothetical 10% maximum drawdown: you need to make 10% while never losing 10%. Roughly 1:1.
- Challenge B allows a hypothetical 5% maximum drawdown: you need to make 10% while never losing 5%. That's 2:1 — you must gain twice what you're allowed to lose.

Challenge B demands a far better risk-adjusted performance even though the "target" looks identical. When comparing challenges, always compute this ratio. A modest target paired with generous drawdown room is often easier than a small target with a tight leash.

## Time limits change the strategy

Some challenges have **no time limit** — you can take months, trading only your best setups. Others impose minimum trading days, maximum durations, or both.

- **No maximum duration:** patience is your edge. Wait for A+ setups; the target will come.
- **Maximum duration:** you must produce the target within the window, which pressures position sizing upward — exactly what the drawdown limits punish. This combination is where most failures happen.
- **Minimum trading days:** prevents passing in one lucky trade, forcing consistent behavior. Plan to spread risk across the required days.

## The psychology trap

The most common target-related failure isn't mathematical — it's behavioral. Traders near the target either:

1. **Get conservative too early** ("I'm 80% there, I'll just protect it") and bleed the remaining distance through tiny fearful trades, or
2. **Get aggressive** ("one more trade and I'm done") and breach the drawdown with oversized risk.

The fix is unglamorous: decide your risk per trade **before** the challenge from the drawdown math, and don't renegotiate it at 90% of the target. Your edge doesn't know how close you are to passing.

## A practical planning method

1. Note the target %, the max drawdown %, and the daily drawdown %.
2. Set risk per trade at roughly one-quarter to one-third of the daily limit.
3. Estimate how many average winning trades the target requires at that risk.
4. Check whether that trade count fits comfortably in the time allowed.

If the plan requires near-perfect performance or maximum risk on every trade, the challenge is mispriced for your strategy — pick a different account size, format, or firm.

**Bottom line:** judge a profit target only in relation to its drawdown limits and time constraints. The number alone tells you almost nothing.$$,
  'published',
  'PropCompare Research Team',
  $$Understanding Profit Targets in Prop Firm Evaluations | PropCompare$$,
  $$Profit targets explained: the target-vs-drawdown ratio that sets real difficulty, how time limits change strategy, and a practical planning method.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'guides'),
  'how-prop-firm-payouts-work',
  'How Prop Firm Payouts Work: Splits, Schedules, and Fine Print',
  $$Passing the challenge is only half the story. Payout policies decide when — and whether — you actually see money. Here's what to check before you celebrate.$$,
  $$## The profit split

Once funded, you keep a **percentage of the simulated profits** you generate — the profit split — and the firm keeps the rest. Splits are the headline number, but they're meaningless without the rest of the policy. A generous split paid rarely, with high minimums and strict conditions, can be worth less than a modest split paid smoothly.

## The four questions that matter more than the split

**1. When is the first payout?** Firms impose a waiting period — a number of days after funding, or after your first trades. Some pay bi-weekly from the start; others make you wait a month or more for payout number one. Know the date before you need the money.

**2. How often after that?** Common rhythms are bi-weekly or monthly, sometimes on-demand after the first cycle. Frequency interacts with minimums: frequent payouts with a high minimum threshold can mean you rarely qualify.

**3. What's the minimum?** Many firms set a minimum withdrawal amount. If your account generates small steady gains, a high minimum can trap profits in the account for months.

**4. What are the conditions?** This is the fine print that causes disputes: consistency requirements on the funded account, rules against withdrawing below a threshold, inactivity clauses, and terms letting the firm withhold payouts for suspected rule violations. Read payout conditions as carefully as the evaluation rules.

## Withdrawal methods and costs

Firms typically pay via bank transfer, crypto, or payment processors. Each method can carry fees, minimums, and processing times — plus your own bank's receiving fees. A payout policy that looks fine on paper can lose a meaningful slice to transfer costs, so factor the full chain into your expectations.

## Refunds of the challenge fee

Some firms refund your evaluation fee — usually after your first payout or on passing — while others never do. "Refundable" sometimes means credited as account balance rather than cash back. Confirm the exact mechanism in writing (the firm's terms page) rather than from marketing copy.

## Scaling plans

Several firms offer **scaling**: grow the account and improve your split after consistent profitable periods. Scaling terms vary widely — some are automatic, others require request and review. Treat scaling as a bonus, not a plan; the base payout policy is what you'll live with.

## Red flags in payout policies

- Vague language about when the firm "may" withhold payouts.
- Retroactive rule changes applied to funded accounts.
- A pattern of payout complaints that the firm doesn't address publicly.
- No clear published payout policy at all — just marketing promises.

**Bottom line:** evaluate payouts as a system — split, timing, minimums, methods, conditions — not as a single percentage. The best challenge in the world is worthless if the money can't reliably reach you.$$,
  'published',
  'PropCompare Research Team',
  $$How Prop Firm Payouts Work: Splits, Schedules & Fine Print | PropCompare$$,
  $$Prop firm payouts explained: profit splits, first-payout timing, minimums, withdrawal methods, refund policies, and red flags to watch for.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'guides'),
  'common-reasons-traders-fail-evaluations',
  'Common Reasons Traders Fail Evaluations (It''s Rarely the Strategy)',
  $$Most failed challenges aren't failed by bad strategies — they're failed by good strategies traded badly under evaluation pressure. The seven patterns below cover the vast majority.$$,
  $$## 1. Revenge trading after the first loss

The sequence is always the same: a normal loss, then a bigger position to "get it back," then a bigger one. Under a daily drawdown limit, this compresses what should be a week of normal variance into a single breach. The evaluation didn't fail the trader; the trader abandoned their plan at the first discomfort.

**Fix:** pre-commit to risk per trade as a fraction of the daily limit, and walk away for the day after two consecutive losses.

## 2. Misunderstanding the drawdown calculation

Traders size positions against the **maximum** drawdown while the **daily** drawdown — often half the size and measured on intraday equity — is the binding constraint. Others don't realize the trail follows equity, not balance. Read our drawdown guides, then re-read the firm's specific definitions.

## 3. Oversizing "because it's almost done"

Near the profit target, traders routinely double position size to finish faster — and breach the drawdown one trade away from passing. Your edge doesn't improve because you're close to the target; your risk just did.

## 4. Trading news without a news plan

High-impact releases create fast, gappy moves that blow through intraday equity limits in seconds. Some firms also restrict holding through news explicitly. Either trade news with deliberately tiny size and wide awareness, or sit out — but decide **before** the calendar, not during the spike.

## 5. Ignoring the consistency rule

Several firms require your best day to stay below a percentage of total profits, or require steady performance across days. A trader who makes 80% of the target in one lucky session can pass the math and still fail the consistency clause. Spread risk deliberately across the required trading days.

## 6. Style mismatch with the rulebook

Scalpers choose challenges with minimum stop distances their strategy can't survive. Swing traders choose challenges banning weekend holding. News traders choose firms that void news-window profits. The strategy was fine; the **challenge was wrong for it**. Match rules to style before paying.

## 7. Treating the fee as tuition already spent

The sunk-cost fallacy is brutal in evaluations: "I've paid, so I must trade." This produces forced trades on no-setup days to satisfy minimum day counts, or desperate sizing to rescue a dying attempt. A calm reset — even abandoning a doomed attempt early — is cheaper than the breach-and-rebuy cycle.

## The meta-pattern

Notice what's missing from this list: "bad strategy." Most evaluation failures are **risk-management and rule-comprehension failures**. The traders who pass tend to be boring: same risk every trade, no news gambling, full knowledge of the rulebook, and the patience to let the target come to them.

**Bottom line:** before your next attempt, audit your last failure against these seven. Fix the behavior first — the strategy was probably never the problem.$$,
  'published',
  'PropCompare Research Team',
  $$Why Traders Fail Prop Firm Evaluations: 7 Common Reasons | PropCompare$$,
  $$The seven patterns behind most failed prop firm evaluations — revenge trading, drawdown misunderstandings, news spikes, and style mismatches — and how to fix them.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'comparisons'),
  'how-to-compare-prop-firm-challenge-fees',
  'How to Compare Prop Firm Challenge Fees (Beyond the Sticker Price)',
  $$The cheapest challenge fee is rarely the cheapest challenge. Here's how to compute the true cost of an attempt — including the attempts you'll probably need.$$,
  $$## The sticker price is just the entry ticket

Challenge fees are quoted per account size: bigger simulated accounts cost more to attempt. But comparing firms on fee alone is like comparing flights on ticket price while ignoring baggage fees, layovers, and cancellation policies. The fee buys an **attempt under a specific rulebook**, and the rulebook determines how many attempts you'll likely need.

## The real metric: expected cost to get funded

Think in terms of **expected total cost**, not single-attempt price:

> Expected cost ≈ fee × expected number of attempts

Expected attempts depend on the difficulty of the rulebook **for your strategy**: the target-to-drawdown ratio, time pressure, and how well the restrictions fit your style. A hypothetical $100 challenge you pass on the second try (hypothetical $200 total) beats a hypothetical $50 challenge that takes six attempts (hypothetical $300 total) — before counting your time.

Be honest about your historical pass rate on demo under similar rules. If you've never passed a comparable evaluation, budget for multiple attempts explicitly rather than hoping the first one works.

## What to normalize when comparing fees

1. **Account size:** compare fees at the same simulated balance. A $50k challenge isn't comparable to a $100k one.
2. **Evaluation format:** one-step, two-step, and instant funding are priced differently because they carry different firm risk. Compare within the same format.
3. **What's included:** some fees bundle platform access or data feeds; others charge separately. Add the extras.
4. **Refund policy:** a fee refunded after the first payout effectively costs nothing if you succeed — which changes the math dramatically versus non-refundable fees.
5. **Discounts:** verified promo codes reduce the effective fee. Check our discounts page, but confirm the code works at checkout before counting on it.

## Fee traps to watch

- **"Cheap" challenges with brutal rules:** a low fee paired with a tight trailing drawdown and short time limit is priced to be re-bought, not passed.
- **Add-on costs:** resets, add-ons, or "express" options that effectively raise the price after purchase.
- **Fee-for-funding swaps:** some models charge more upfront but pay out faster or more reliably — the fee is only one side of the value equation.
- **Currency and payment fees:** cross-border payment processing can add a few percent; check the final checkout total, not the advertised figure.

## A simple comparison worksheet

For each candidate challenge, write down: fee at your account size, format, target-to-drawdown ratio, time constraints, refund terms, verified discount, and your honest estimated attempts. Multiply fee by attempts, subtract expected refund value, and rank by that number — then sanity-check the winner's rulebook against your trading style.

**Bottom line:** compare the cost of *getting funded*, not the cost of *trying once*. The cheapest fee with the hardest rules is usually the most expensive challenge on the shelf.$$,
  'published',
  'PropCompare Research Team',
  $$How to Compare Prop Firm Challenge Fees Properly | PropCompare$$,
  $$Beyond the sticker price: expected cost per funded account, what to normalize across firms, refund math, and the fee traps that inflate the real price.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'guides'),
  'news-trading-and-weekend-holding-rules',
  'News Trading and Weekend Holding Rules, Explained',
  $$Two of the most misunderstood restrictions in prop challenges: what firms actually ban around news events and weekends — and how to stay compliant without changing your strategy.$$,
  $$## Why these rules exist

From the firm's perspective, news spikes and weekend gaps are **unmodelable risk**: prices can jump past stop losses, creating losses far beyond what the risk models assume. Since most firms pay for your simulated profits from fee revenue, they restrict the behaviors that produce sudden, outsized, luck-driven results — or catastrophic gaps.

## News trading rules: the common variants

Firms implement news restrictions in several ways, and the differences matter enormously:

- **No restriction:** trade freely through news. Rare, and usually paired with strict drawdown limits that do the restricting for you.
- **No opening/closing near releases:** a blackout window (often 1–2 minutes before and after high-impact events) during which you may not open or close positions. Existing positions may be allowed to ride.
- **No holding through news:** positions open into a restricted release may have their profits voided — or the challenge terminated.
- **Stricter intraday equity enforcement:** no explicit news rule, but the daily drawdown on equity makes news spikes lethal anyway.

The critical detail is **which events count**. "High-impact news" usually means a defined list (central bank decisions, NFP, CPI), but some firms use broader definitions. Find the firm's exact list and its timezone before you trade.

## Weekend holding rules

Many firms **prohibit holding positions over the weekend** — all positions must be closed before the market closes on Friday (at a specified server time). Variants include:

- **Hard close:** positions still open at the cutoff are closed automatically, sometimes at unfavorable prices, and may count as a violation.
- **No new weekend positions:** you can't open late Friday, but existing rules vary.
- **Allowed with conditions:** some programs permit weekend holding on certain account types.

Crypto traders should note: crypto markets don't close, but the firm's rule may still apply to weekend exposure — check whether the restriction covers all instruments or just forex.

## How to stay compliant

1. **Get the definitions in writing:** the restricted event list, the blackout window in minutes, the Friday cutoff time with timezone.
2. **Put them on your calendar:** recurring blocks for weekly releases and a Friday flatten reminder. Compliance should be a system, not a memory.
3. **Know the penalty:** voided profits vs. terminated challenge are very different risks. Size accordingly.
4. **Check the funded stage too:** some firms relax news rules after funding; others keep them forever. The evaluation rulebook isn't the whole story.

## If your strategy needs news or weekends

Don't fight the rulebook — **pick a different challenge**. News scalpers should shortlist firms with no news restriction (and accept the drawdown discipline that comes with it). Swing traders who hold for days should filter for weekend holding allowed. Paying for a challenge whose rules criminalize your edge is donating the fee.

**Bottom line:** news and weekend rules are precise, technical, and firm-specific. Get the exact definitions, calendarize them, and never assume one firm's policy matches another's.$$,
  'published',
  'PropCompare Research Team',
  $$News Trading & Weekend Holding Rules in Prop Firms | PropCompare$$,
  $$Prop firm news trading and weekend holding rules explained: common variants, which events count, penalties, and how to stay compliant.$$,
  now()
),
(
  (select id from public.article_categories where slug = 'guides'),
  'how-affiliate-discounts-work',
  'How Affiliate Discounts Work (and How to Use Them Safely)',
  $$Discount codes can cut real money off challenge fees — but only if they're genuine, current, and actually applied. Here's how the ecosystem works and how to avoid the traps.$$,
  $$## Where discount codes come from

Prop firms run promotions directly (seasonal sales, launch offers) and also distribute codes through **affiliates** — comparison sites, educators, and communities that promote the firm in exchange for a commission. When you use an affiliate's code or link, the firm tracks the sale back to them and pays a cut of the fee.

This is why the same firm can have five different codes floating around at different percentages: each affiliate negotiates or is assigned their own offer.

## Why the price is the same for you

The important mechanic: **affiliate commissions come from the firm's margin, not your wallet**. The checkout price with a valid code is the discounted price — the firm simply shares part of what it receives with the referrer. You don't pay extra for using a code; you pay less than the sticker price.

## How to verify a code before you rely on it

1. **Check the source date.** Codes expire constantly. A code from a six-month-old video is probably dead.
2. **Look for verification status.** We mark codes as verified only when we've confirmed them against a source; unverified codes are labeled as such.
3. **Test at checkout.** Enter the code on the firm's actual checkout page and confirm the discount applies *before* paying. Never assume.
4. **Read the terms.** Codes often exclude certain account sizes, new programs, or can't be combined with other offers. "Up to 20% off" might mean 20% on one specific challenge.

## Common discount traps

- **Inflated "was" prices:** a 50% discount off a price nobody ever paid is marketing, not savings. Compare against the firm's standard published fee.
- **Urgency theater:** countdown timers that reset, "last chance" banners that never end. Real promotions have real end dates — check them.
- **Code-gated upsells:** some funnels use a discount to pull you into a more expensive program than you planned. Decide the right challenge first, then find its code.
- **Fake codes:** random strings posted without a source that simply don't work at checkout. If there's no verifiable source, treat it as fiction.

## The smart way to stack savings

Pick the right challenge for your strategy first (rules, format, payout policy). Then check for a verified code for that specific program and account size. A 10% code on the right challenge beats a 25% code on the wrong one — because the wrong challenge costs you the entire fee when the rules don't fit.

**Bottom line:** affiliate discounts are real money when the code is verified and the terms match your purchase. Verify at checkout, read the exclusions, and never let the discount choose the challenge for you.$$,
  'published',
  'PropCompare Research Team',
  $$How Affiliate Discount Codes Work for Prop Firms | PropCompare$$,
  $$Affiliate discount codes explained: where codes come from, why they don't cost you extra, how to verify them, and the traps to avoid.$$,
  now()
)
on conflict (slug) do nothing;
