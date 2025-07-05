import { Transform, } from 'stream';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from "fs"
import path from "path"

interface CaptureResult {
  filePath: string;
  cleanup: () => Promise<void>;
}

const formatTimeframeForURL = (timeframeInput: string): string => {
  const tf = timeframeInput.toLowerCase();
  if (tf.endsWith('m') && !tf.startsWith('1m')) return tf.slice(0, -1);
  if (tf.endsWith('h')) return (parseInt(tf.slice(0, -1), 10) * 60).toString();
  if (tf.includes('d')) return 'D';
  if (tf.includes('w')) return 'W';
  if (tf.includes('m')) return 'M';
  return timeframeInput;
};

export async function captureTV(
  symbol: string,
  timeframe: string
): Promise<CaptureResult | null> {
  const formattedSymbol = symbol.toUpperCase();
  const chartUrl = `https://s.tradingview.com/widgetembed/?symbol=${formattedSymbol}&interval=${formatTimeframeForURL(
    timeframe
  )}&theme=dark&style=1&hideideas=1`;

  let browser: Browser | null = null;
  let downloadedFilePath: string | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080 });

    await page.goto(chartUrl, { waitUntil: "networkidle2" });

    await page.waitForSelector('canvas[data-name="pane-canvas"]', {
      timeout: 15000,
    });

    const screenshotPath = path.join(
      __dirname,
      `chart-${Date.now()}.png`
    ) as `${string}.png`;

    await page.screenshot({ path: screenshotPath });
    downloadedFilePath = screenshotPath;

    return {
      filePath: downloadedFilePath,
      cleanup: async (): Promise<void> => {
        if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
          fs.unlinkSync(downloadedFilePath);
        }
      },
    };
  } catch (error) {
    console.error("Error capturing TV:", error);
    if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
      fs.unlinkSync(downloadedFilePath);
    }
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function transformToBuffer(transform: Transform): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    transform.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    transform.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    transform.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export function isAnimatedWebp(buffer: Buffer): boolean {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return false;
  if (buffer.toString('ascii', 8, 12) !== 'WEBP') return false;

  for (let i = 12; i < buffer.length - 4; i++) {
    if (buffer.toString('ascii', i, i + 4) === 'ANIM') return true;
  }

  return false;
}
