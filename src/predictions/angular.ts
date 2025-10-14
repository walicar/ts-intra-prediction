import { M } from '../utils';

// 2 stub modes + 33 angle modes,
// index using the intrapred mode
const angleTable: number[] = [
  0, 0, 32, 26, 21, 17, 13, 9, 5, 2, 0, -2, -5, -9, -13, -17, -21, -26, -32,
  -26, -21, -17, -13, -9, -5, -2, 0, 2, 5, 9, 13, 17, 21, 26, 32,
];

// 15 negative displacements in Q8 format,
// index using [mode - 11], such that angelTable[mode] < 0
// subtract 11 to start at the first negative mode
const invAngleTable: number[] = [
  -4096, -1638, -910, -630, -482, -390, -315, -256, -315, -390, -482, -630,
  -910, -1638, -4096,
];

export const predictAngular = (
  data: Uint8ClampedArray,
  samples: number[][],
  mode = 2,
) => {
  // create reference array
  const ref: number[][] = Array(4 * M + 1).fill([0, 0, 0, 0]);
  const C = 2 * M; // center index points to the topleft ref pixel

  const isVertical = mode >= 18;
  const d = angleTable[mode]; // displacement

  if (isVertical) {
    // fill ref with horizontal references
    for (let x = 0; x <= M; x++) {
      ref[C + x] = samples[C + x];
    }

    if (d < 0) {
      // fill ref with projected vertical references
      const invD = invAngleTable[mode - 11]; // inverse displacement
      for (let x = Math.floor((M * d) / 32); x <= -1; x++) {
        // negative displacment to the left from topleft ref pixel
        const nD = Math.floor((x * invD + 128) / 256);
        ref[C + x] = samples[C - nD];
      }
    } else {
      // fill ref with more horizontal references
      for (let x = M; x <= 2 * M; x++) {
        ref[C + x] = samples[C + x];
      }
    }
  } else {
    // fill ref with vertical references
    for (let y = 0; y <= M; y++) {
      ref[C + y] = samples[C - y];
    }

    if (d < 0) {
      // fll ref with projected horizontal references
      const invD = invAngleTable[mode - 11];
      for (let y = Math.floor((M * d) / 32); y <= -1; y++) {
        const nD = Math.floor((y * invD + 128) / 256);
        ref[C + y] = samples[C + nD];
      }
    } else {
      // fill ref with more vertical references
      for (let y = M; y <= 2 * M; y++) {
        ref[C + y] = samples[C - y];
      }
    }
  }

  // write prediction
  for (let y = 0; y < M; y++) {
    for (let x = 0; x < M; x++) {
      let offset;
      let weight;
      let k;

      if (isVertical) {
        offset = Math.floor(((y + 1) * d) / 32);
        weight = Math.abs(((y + 1) * d) % 32);
        k = x + 1 + offset;
      } else {
        offset = Math.floor(((x + 1) * d) / 32);
        weight = Math.abs(((x + 1) * d) % 32);
        k = y + 1 + offset;
      }

      const i = y * M + x;
      if (weight === 0) {
        const color = ref[C + k];
        data.set(color, i * 4);
      } else {
        const bFactor = (32 - weight) / 32;
        const aFactor = weight / 32;

        const bColor = ref[C + k];
        const aColor = ref[C + k + 1];

        const b = bColor.map((v) => v * bFactor);
        const a = aColor.map((v) => v * aFactor);
        const color = a.map((v, i) => Math.floor(v + b[i]));

        data.set(color, i * 4);
      }
    }
  }
};
