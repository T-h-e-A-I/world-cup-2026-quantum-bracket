// Client-side share card: render the user's collapsed bracket to a PNG they can
// post anywhere. Uses emoji flags + system fonts so nothing is fetched (no CORS
// taint), which keeps canvas.toBlob() working everywhere.

export interface CardData {
  championName: string;
  championFlag: string; // emoji
  runnerName: string;
  runnerFlag: string;
  headline: string; // e.g. "1 in 14,553,634" or "12.4% to win"
  headlineLabel: string; // e.g. "This exact bracket" or "Champion odds"
  decided: number; // matches decided / 31
}

const INK = "#0a0a0b";
const QUANTUM = "#6d5efc";
const MUTE = "#8a909c";
const FAINT = "#5a606b";
const WHITE = "#f6f7f9";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function roundRect(x: CanvasRenderingContext2D, l: number, t: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(l + r, t);
  x.arcTo(l + w, t, l + w, t + h, r);
  x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r);
  x.arcTo(l, t, l + w, t, r);
  x.closePath();
}

/** Draw the card and trigger a PNG download. */
export function downloadBracketCard(d: CardData): void {
  const W = 1200, H = 630;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) return;

  // background + accent frame
  x.fillStyle = INK;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = QUANTUM;
  x.lineWidth = 8;
  x.strokeRect(4, 4, W - 8, H - 8);
  x.fillStyle = QUANTUM;
  x.fillRect(0, 0, 14, H);

  const pad = 80;
  x.textBaseline = "alphabetic";

  // wordmark
  x.fillStyle = MUTE;
  x.font = `600 26px ${SANS}`;
  x.fillText("QUANTUM BRACKET", pad, 96);
  x.fillStyle = FAINT;
  x.font = `500 22px ${SANS}`;
  x.fillText("My 2026 World Cup", pad, 132);

  // champion
  x.fillStyle = FAINT;
  x.font = `600 22px ${SANS}`;
  x.fillText("CHAMPION", pad, 232);

  x.font = `90px ${SANS}`;
  x.fillText(d.championFlag, pad, 330);
  x.fillStyle = WHITE;
  x.font = `700 78px ${SANS}`;
  x.fillText(trunc(x, d.championName, W - pad - 220), pad + 130, 322);

  // runner-up
  x.fillStyle = MUTE;
  x.font = `400 30px ${SANS}`;
  x.fillText(`def. ${d.runnerFlag} ${d.runnerName} in the final`, pad, 400);

  // headline odds box
  const boxW = W - pad * 2;
  roundRect(x, pad, 446, boxW, 104, 22);
  x.fillStyle = "rgba(109,94,252,0.12)";
  x.fill();
  x.strokeStyle = "rgba(109,94,252,0.45)";
  x.lineWidth = 2;
  x.stroke();
  x.fillStyle = FAINT;
  x.font = `600 22px ${SANS}`;
  x.fillText(d.headlineLabel.toUpperCase(), pad + 28, 492);
  x.fillStyle = QUANTUM;
  x.font = `700 46px ${SANS}`;
  x.fillText(d.headline, pad + 28, 534);

  // footer
  x.fillStyle = FAINT;
  x.font = `400 22px ${SANS}`;
  x.fillText(`${d.decided}/31 matches decided`, pad, 596);
  x.textAlign = "right";
  x.fillText("world-cup-2026-quantum-bracket.vercel.app", W - pad, 596);
  x.textAlign = "left";

  c.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-world-cup-2026-bracket.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, "image/png");
}

function trunc(x: CanvasRenderingContext2D, s: string, max: number): string {
  if (x.measureText(s).width <= max) return s;
  let out = s;
  while (out.length > 1 && x.measureText(out + "…").width > max) out = out.slice(0, -1);
  return out + "…";
}
