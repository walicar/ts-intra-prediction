import { M, WIDTH } from "../utils";

export const predictDC = (data: Uint8ClampedArray, samples: number[][]) => {
  const avgColor = averageColor(samples);
  for (let i = 0; i < M * M; i++) {
    const offset = i + (WIDTH + 1);

    const start = M + WIDTH;
    const n = Math.ceil((offset - start) / M);
    const padding = n * (M + 1);
    let color = avgColor;

    const y = Math.floor(i / M);
    const x = i % M;

    // boundary filtering
    if (x === 0 && y === 0) {
      const ct = M - 1;
      const left = ct + M;
      const top = 3 * M - ct;
      const leftColor = samples[left];
      const topColor = samples[top];

      color = color.map((v, i) => 2 * v + leftColor[i] + topColor[i]);
      color = color.map((v) => v >> 2); // div by 4
    } else if (y === 0) {
      // along the topmost row
      const top = x + 2 * M;
      const topColor = samples[top];

      color = color.map((v, i) => 3 * v + topColor[i]);
      color = color.map((v) => v >> 2);
    } else if (x === 0) {
      // along the leftmost column
      const left = 2 * M - y;
      const leftColor = samples[left];

      color = color.map((v, i) => 3 * v + leftColor[i]);
      color = color.map((v) => v >> 2);
    }
    data.set(color, (offset + padding) * 4);
  }
};

const averageColor = (samples: number[][]) => {
  const sumColor = [0, 0, 0, 0];
  for (let i = 0; i < M; i++) {
    const left = i + M;
    const top = 3 * M - i;
    const leftColor = samples[left];
    const topColor = samples[top];

    const mixColor = leftColor.map((v, i) => v + topColor[i]);

    sumColor[0] += mixColor[0];
    sumColor[1] += mixColor[1];
    sumColor[2] += mixColor[2];
    sumColor[3] += mixColor[3];
  }

  // equivalent to 1/(2*BLOCK_SIZE)
  return sumColor.map((v) => v >> (1 + Math.log2(M)));
};