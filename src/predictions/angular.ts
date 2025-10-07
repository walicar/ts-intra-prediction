import { M } from '../utils';

// 1 + 34
const angleTable: Record<number, number> = [
  0, 0, 32, 26, 21, 17, 13, 9, 5, 2, 0, -2, -5, -9, -13, -17, -21, -26, -32,
  -26, -21, -17, -13, -9, -5, -2, 0, 2, 5, 9, 13, 17, 21, 26, 32,
];

export const predictAngular = (
  data: Uint8ClampedArray,
  samples: number[][],
  mode = 2,
) => {
  for (let y = 0; y < M; y++) {
    for (let x = 0; x < M; x++) {
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
      const idx = isVertical ? M * 2 + k : M * 2 - k;
      const bFactor = (32 - weight) / 32;
      const aFactor = weight / 32;

      const bColor = samples[idx];
      const aColor = samples[idx + 1] ?? samples[idx]; // clamp if OOB

      const b = bColor.map((v) => v * bFactor);
      const a = aColor.map((v) => v * aFactor);
      const color = a.map((v, i) => Math.round(v + b[i]));

      const i = y * M + x;
      data.set(color, i * 4);
    }
  }
};
