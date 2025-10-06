import { M, WIDTH } from "../utils";

const angleTable: Record<number, number> = {
  2: 32,
  3: 26,
  4: 21,
  5: 17,
  6: 13,
  7: 9,
  8: 5,
  9: 2,
  10: 0,
  11: -2,
  12: -5,
  13: -9,
  14: -13,
  15: -17,
  16: -21,
  17: -26,
  18: -32,
  19: -26,
  20: -21,
  21: -17,
  22: -13,
  23: -9,
  24: -5,
  25: -2,
  26: 0,
  27: 2,
  28: 5,
  29: 9,
  30: 13,
  31: 17,
  32: 21,
  33: 26,
}

export const predictAngular = (data: Uint8ClampedArray, samples: number[][], mode = 2) => {
  for (let i = 0; i < M * M; i++) {
    const y = Math.floor(i / M);
    const x = i % M;

    const isVertical = mode > 18;
    const displacement = angleTable[mode];
    let offset;
    let weight;
    let k;
    if (isVertical) { 
      // vertical mode
      offset = Math.floor(((y + 1) * displacement) / 32);
      weight = Math.abs(((y + 1) * displacement) % 32);
      k = x + 1 + offset;
    } else { 
      // horizontal
      offset = Math.floor(((x + 1) * displacement) / 32);
      weight = Math.abs(((x + 1) * displacement) % 32);
      k = y + 1 + offset;
    }

    // remember: M * 2 = 32 which is the index of the top left pixel 
    // fixed: negative weight is bad!
    const idx = isVertical ? (M * 2) + k : (M * 2) - k;
    const bFactor = (32 - weight) / 32;
    const aFactor = weight / 32;

    const bColor = samples[idx];
    const aColor = samples[idx + 1];

    const b = bColor.map((v) => v * bFactor);
    const a = aColor.map((v) => v * aFactor);
    const color = a.map((v, i) => Math.round(v + b[i]));

    data.set(color, i * 4);
  }
}