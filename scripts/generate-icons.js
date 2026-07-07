const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const t = y / size;

      let r = 125;
      let g = 211;
      let b = 252;

      if (t > 0.55) {
        r = 253;
        g = 230;
        b = 138;
      } else if (t > 0.35) {
        r = 186;
        g = 230;
        b = 253;
      }

      const sunX = size * 0.76;
      const sunY = size * 0.22;
      const sunR = size * 0.11;
      const dx = x - sunX;
      const dy = y - sunY;
      if (dx * dx + dy * dy <= sunR * sunR) {
        r = 253;
        g = 224;
        b = 71;
      }

      const barY = size * 0.68;
      const barH = size * 0.08;
      const barX = size * 0.17;
      const barW = size * 0.66;
      if (y >= barY && y <= barY + barH && x >= barX && x <= barX + barW * 0.55) {
        r = 255;
        g = 90;
        b = 90;
      }

      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }

  const raw = Buffer.alloc((size * (1 + size * 3)));
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0;
    offset += 1;
    pixels.copy(raw, offset, y * size * 4, (y + 1) * size * 4);
    offset += size * 4;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);

  return png;
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "icon-192.png"), createIcon(192));
fs.writeFileSync(path.join(outDir, "icon-512.png"), createIcon(512));
console.log("Generated icons/icon-192.png and icons/icon-512.png");
