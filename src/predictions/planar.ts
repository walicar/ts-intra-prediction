import { M, mix } from '../utils';

export const predictPlanar = (data: Uint8ClampedArray, samples: number[][]) => {
  const fSamples: Uint8ClampedArray[] = [];
  const applyFilter = (triplet: number[][]): Uint8ClampedArray => {
    const lowPass = [0.25, 0.5, 0.25];
    const a = triplet[0].map((v) => v * lowPass[0]);
    const b = triplet[1].map((v) => v * lowPass[1]);
    const c = triplet[2].map((v) => v * lowPass[2]);
    const r = [...a.map((v, i) => v + b[i] + c[i])];
    return new Uint8ClampedArray(r);
  };

  for (let i = 0; i < samples.length; i += 1) {
    let fColor: Uint8ClampedArray;

    // clamp edges
    if (i === 0) {
      fColor = applyFilter([samples[0], samples[0], samples[1]]);
    } else if (i === samples.length - 1) {
      const last = samples.length - 1;
      fColor = applyFilter([samples[last - 1], samples[last], samples[last]]);
    } else {
      fColor = applyFilter([samples[i - 1], samples[i], samples[i + 1]]);
    }
    fSamples.push(fColor);
  }

  const C = 2 * M;
  for (let y = 0; y < M; y++) {
    for (let x = 0; x < M; x++) {
      // horizontal color
      const hbf = (M - y - 1) / M;
      const hbr = fSamples[C + x];
      const hbc = hbr.map((v) => v * hbf);

      const haf = (y - 1) / M;
      const har = fSamples[C - M];
      const hac = har.map((v) => v * haf);

      const hc = hbc.map((v, i) => v + hac[i]);

      // vertical color
      const vbf = (M - x - 1) / M;
      const vbr = fSamples[C - y];
      const vbc = vbr.map((v) => v * vbf);

      const vaf = (x - 1) / M;
      const vaR = fSamples[C + M];
      const vac = vaR.map((v) => v * vaf);

      const vc = vbc.map((v, i) => v + vac[i]);

      const color = hc.map((v, i) => Math.floor((v + vc[i]) / 2));
      color[3] = 255;
      const i = y * M + x;
      data.set(color, i * 4);
    }
  }
};
