import { M, mix } from "../utils";

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

  const ls = fSamples[2 * M - 1]; // left start
  const le = fSamples[M]; // left end
  const ts = fSamples[2 * M + 1]; // top start
  const te = fSamples[3 * M - 1]; // top end

  for (let i = 0; i < M * M; i++) {
    const y = Math.floor(i / M);
    const x = i % M;
    const horiColor = mix(ls, le, y / M);
    const vertColor = mix(ts, te, x / M);
    const color = mix(horiColor, vertColor, 0.5);
    data.set(color, i * 4);
  }
};