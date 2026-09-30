type Random = () => number;

/** Standard normal CDF, via the Abramowitz & Stegun 7.1.26 erf approximation (error under 1.5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

export interface VarianceInput {
  /** Win rate in big blinds per 100 hands. */
  winRate: number;
  /** Standard deviation in big blinds per 100 hands. */
  stdDev: number;
  hands: number;
  /** Bankroll in big blinds. */
  bankroll: number;
}

export interface VarianceSummary {
  /** Expected result over the sample, in big blinds. */
  expected: number;
  /** Standard deviation of the result over the sample. */
  sd: number;
  /** 95% of results fall between these. */
  low95: number;
  high95: number;
  /** Chance of being down after the sample. */
  probLoss: number;
  /** Chance of ever losing the whole bankroll, playing forever at this win rate. */
  riskOfRuin: number;
  /** Bankroll in big blinds for a 5% risk of ruin (Infinity for non-winners). */
  bankrollFor5: number;
}

/**
 * Results over many hands are close to normal: mean winRate × hands/100 and
 * standard deviation stdDev × √(hands/100). Risk of ruin uses the diffusion
 * formula exp(−2 × winRate × bankroll ÷ stdDev²), all per 100 hands.
 */
export function varianceSummary({ winRate, stdDev, hands, bankroll }: VarianceInput): VarianceSummary {
  const blocks = hands / 100;
  const expected = winRate * blocks;
  const sd = stdDev * Math.sqrt(blocks);
  const winner = winRate > 0;
  return {
    expected,
    sd,
    low95: expected - 1.96 * sd,
    high95: expected + 1.96 * sd,
    probLoss: sd > 0 ? normalCdf(-expected / sd) : expected < 0 ? 1 : 0,
    riskOfRuin: winner ? Math.exp((-2 * winRate * bankroll) / (stdDev * stdDev)) : 1,
    bankrollFor5: winner ? (-(stdDev * stdDev) * Math.log(0.05)) / (2 * winRate) : Infinity,
  };
}

/** A standard normal sample (Box–Muller). */
function gaussian(random: Random): number {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Simulated running results in big blinds, `points` evenly spaced checkpoints per
 * path (starting at 0). Each 100-hand block is a normal step with the given mean
 * and standard deviation.
 */
export function simulatePaths(
  { winRate, stdDev, hands }: Pick<VarianceInput, "winRate" | "stdDev" | "hands">,
  paths: number,
  points: number,
  random: Random = Math.random,
): number[][] {
  const blocks = Math.max(1, Math.round(hands / 100));
  const every = blocks / (points - 1);
  return Array.from({ length: paths }, () => {
    const out = [0];
    let total = 0;
    let next = every;
    for (let b = 1; b <= blocks; b++) {
      total += winRate + stdDev * gaussian(random);
      while (b >= next - 1e-9 && out.length < points) {
        out.push(total);
        next += every;
      }
    }
    while (out.length < points) out.push(total);
    return out;
  });
}
