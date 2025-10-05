import { predictAngular } from "./predictions/angular";
import { predictDC } from "./predictions/dc";
import { predictPlanar } from "./predictions/planar";

export const M = 16; // BLOCK SIZE
export const WIDTH = 1 + M * 2;
export const HEIGHT = 1 + M * 2;

export interface PredictionContext {
  imgCtx: ImageBitmapRenderingContext;
  line: number[]; // surrounding line
  mode: number;
}

export const makePred = async (
  preCtx: PredictionContext,
): Promise<PredictionContext> => {
  const { imgCtx, line, mode } = preCtx;

  const data = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
  data.fill(255);
  const samples: number[][] = parseLine(line);
  const mid = Math.floor(samples.length / 2);

  // along left side
  for (let i = 0; i < M * 2; i++) {
    const offset = (HEIGHT - i - 1) * WIDTH * 4;
    data.set(samples[i], offset);
  }

  // top left corner
  data.set(samples[mid]);

  // along top side
  for (let i = 0; i < M * 2; i++) {
    const offset = (i + 1) * 4;
    data.set(samples[mid + i + 1], offset);
  }

  // create prediction block
  if (mode == 0) {
    predictDC(data, samples);
  } else if (mode == 1) {
    predictPlanar(data, samples);
  } else if (mode < 34) {
    predictAngular(data, samples, mode);
  } else {
    throw new Error('mode not implemented!');
  }

  const imageData = new ImageData(data, WIDTH, HEIGHT);
  const imageBitmap = await createImageBitmap(imageData);
  imgCtx.transferFromImageBitmap(imageBitmap);
  return preCtx;
};

export const parseLine = (line: number[]) => {
  const lineColors: number[][] = [];
  for (let i = 0; i < line.length; i += 4) {
    const r = line[i];
    const g = line[i + 1];
    const b = line[i + 2];
    const count = line[i + 3];
    for (let j = 0; j < count; j++) {
      lineColors.push([r, g, b, 255]);
    }
  }
  return lineColors;
};

type Color = Uint8ClampedArray;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: Color, b: Color, t: number) =>
  a.map((v, i) => lerp(v, b[i], t));
