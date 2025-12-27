export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export class Bitmap {
  width: number;
  height: number;
  data: Uint8ClampedArray;

  constructor(width: number, height: number, data?: Uint8ClampedArray) {
    this.width = width;
    this.height = height;
    if (data) {
      this.data = data;
    } else {
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }

  static createFromData(width: number, height: number, data: Uint8ClampedArray): Bitmap {
    return new Bitmap(width, height, data);
  }

  clone(): Bitmap {
    return new Bitmap(this.width, this.height, new Uint8ClampedArray(this.data));
  }

  fill(color: Rgba): void {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = color.r;
      this.data[i + 1] = color.g;
      this.data[i + 2] = color.b;
      this.data[i + 3] = color.a;
    }
  }

  getPixel(x: number, y: number): Rgba {
    const idx = (y * this.width + x) * 4;
    return {
      r: this.data[idx],
      g: this.data[idx + 1],
      b: this.data[idx + 2],
      a: this.data[idx + 3]
    };
  }
}
