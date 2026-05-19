import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputPath = path.join(root, "public/images/sitaram-avatar-popout.png");
const backgroundPath = path.join(root, "public/images/sitaram-avatar-bg.jpg");
const subjectPath = path.join(root, "public/images/sitaram-avatar-cutout.png");

const canvas = { width: 1024, height: 1120 };
const circle = { cx: 512, cy: 650, r: 350 };
const ringWidth = 18;
const cutY = circle.cy + 20;
const subject = { size: 820, left: 112, top: 186 };

function svg(body) {
  return Buffer.from(
    `<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
  );
}

async function pngMask(body) {
  return sharp(svg(body)).png().toBuffer();
}

await mkdir(path.dirname(outputPath), { recursive: true });

const circleMask = await pngMask(`
  <circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="white"/>
`);

const topHalfMask = await pngMask(`
  <rect x="0" y="0" width="${canvas.width}" height="${cutY}" fill="white"/>
`);

const bottomHalfMask = await pngMask(`
  <rect x="0" y="${cutY}" width="${canvas.width}" height="${canvas.height - cutY}" fill="white"/>
`);

const shadow = svg(`
  <defs>
    <filter id="avatar-shadow" x="-35%" y="-35%" width="170%" height="170%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="28"/>
      <feOffset dy="22"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.18"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="#12201c" filter="url(#avatar-shadow)"/>
`);

const ring = svg(`
  <circle
    cx="${circle.cx}"
    cy="${circle.cy}"
    r="${circle.r}"
    fill="none"
    stroke="#a8f7e3"
    stroke-width="${ringWidth}"
  />
`);

const mountain = await sharp(backgroundPath)
  .resize(circle.r * 2, circle.r * 2, { fit: "cover", kernel: sharp.kernel.lanczos3 })
  .png()
  .toBuffer();

const mountainCanvas = await sharp({
  create: {
    width: canvas.width,
    height: canvas.height,
    channels: 4,
    background: "transparent"
  }
})
  .composite([{ input: mountain, left: circle.cx - circle.r, top: circle.cy - circle.r }])
  .png()
  .toBuffer();

const mountainCircle = await sharp(mountainCanvas)
  .composite([{ input: circleMask, blend: "dest-in" }])
  .png()
  .toBuffer();

const subjectImage = await sharp(subjectPath)
  .resize(subject.size, subject.size, { fit: "contain", kernel: sharp.kernel.lanczos3 })
  .sharpen({ sigma: 0.35, m1: 0.5, m2: 1.4 })
  .png()
  .toBuffer();

const subjectCanvas = await sharp({
  create: {
    width: canvas.width,
    height: canvas.height,
    channels: 4,
    background: "transparent"
  }
})
  .composite([{ input: subjectImage, left: subject.left, top: subject.top }])
  .png()
  .toBuffer();

const subjectTop = await sharp(subjectCanvas)
  .composite([{ input: topHalfMask, blend: "dest-in" }])
  .png()
  .toBuffer();

const subjectBottom = await sharp(subjectCanvas)
  .composite([
    { input: circleMask, blend: "dest-in" },
    { input: bottomHalfMask, blend: "dest-in" }
  ])
  .png()
  .toBuffer();

const joinedSubject = await sharp({
  create: {
    width: canvas.width,
    height: canvas.height,
    channels: 4,
    background: "transparent"
  }
})
  .composite([
    { input: subjectBottom, left: 0, top: 0 },
    { input: subjectTop, left: 0, top: 0 }
  ])
  .png()
  .toBuffer();

const finalCanvas = await sharp({
  create: {
    width: canvas.width,
    height: canvas.height,
    channels: 4,
    background: "transparent"
  }
})
  .composite([
    { input: shadow, left: 0, top: 0 },
    { input: mountainCircle, left: 0, top: 0 },
    { input: ring, left: 0, top: 0 },
    { input: joinedSubject, left: 0, top: 0 }
  ])
  .png()
  .toBuffer();

await sharp(finalCanvas)
  .extract({ left: 96, top: 84, width: 832, height: 960 })
  .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
  .toFile(outputPath);

console.log(outputPath);
