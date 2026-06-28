// Client-side share card: render the user's FULL collapsed bracket to a PNG they can
// post anywhere. Uses emoji flags + system fonts so nothing is fetched (no CORS taint),
// which keeps canvas.toBlob() working everywhere.

export interface CardNode {
  level: number; // 1=R32 ... 5=Final
  start: number; // leaf index of the subtree (0..31)
  aId: number; // top participant (favorite stands in if undecided)
  bId: number; // bottom participant
  winnerId: number; // decided pick, else the model favorite to win this node
}

export interface BracketCard {
  nodes: CardNode[];
  teams: { name: string; flag: string }[]; // indexed by team id
  championId: number;
  headline: string; // e.g. "1 in 14,553,634" or "12.4% to win"
  headlineLabel: string; // "This exact bracket" / "Champion odds"
  decided: number; // 0..31
}

const INK = "#0a0a0b";
const PANEL = "#141417";
const QUANTUM = "#6d5efc";
const GOLD = "#d8a838";
const MUTE = "#9097a3";
const FAINT = "#5a606b";
const LINE = "#26272d";
const WHITE = "#f6f7f9";
const SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const W = 1600;
const H = 980;
const PAD = 36;
const TITLE_H = 92;
const TOP = TITLE_H + 34;
const BOTTOM = H - 44;
const BH = BOTTOM - TOP; // bracket height
const PITCH = BH / 8; // 8 R32 boxes per side
const COLW = (W - 2 * PAD) / 9; // 9 columns: 4 left, final, 4 right
const BOXW = COLW - 16;
const BOXH = 76;
const ROUND_LABEL = ["R32", "R16", "QF", "SF", "FINAL", "SF", "QF", "R16", "R32"];

function colIndex(level: number, start: number): number {
  if (level === 5) return 4;
  return start < 16 ? level - 1 : 9 - level;
}

function rectOf(level: number, start: number) {
  const ci = colIndex(level, start);
  const x = PAD + ci * COLW + 8;
  let cy: number;
  if (level === 5) {
    cy = TOP + BH / 2;
  } else {
    const local = start < 16 ? start : start - 16;
    const bLo = local / 2;
    const span = 1 << (level - 1);
    cy = TOP + (bLo + (span - 1) / 2 + 0.5) * PITCH;
  }
  return { x, cy, ci, side: start < 16 ? 0 : 1 };
}

function roundRect(x: CanvasRenderingContext2D, l: number, t: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(l + r, t);
  x.arcTo(l + w, t, l + w, t + h, r);
  x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r);
  x.arcTo(l, t, l + w, t, r);
  x.closePath();
}

function trunc(x: CanvasRenderingContext2D, s: string, max: number): string {
  if (x.measureText(s).width <= max) return s;
  let out = s;
  while (out.length > 1 && x.measureText(out + "…").width > max) out = out.slice(0, -1);
  return out + "…";
}

/** Pure renderer (works with any Canvas2D context — browser or test). */
export function drawBracketCard(x: CanvasRenderingContext2D, d: BracketCard): void {
  // background + accent frame
  x.fillStyle = INK;
  x.fillRect(0, 0, W, H);
  x.strokeStyle = QUANTUM;
  x.lineWidth = 6;
  x.strokeRect(3, 3, W - 6, H - 6);
  x.fillStyle = QUANTUM;
  x.fillRect(0, 0, 12, H);
  x.textBaseline = "middle";

  // title
  x.textBaseline = "alphabetic";
  x.fillStyle = WHITE;
  x.font = `700 34px ${SANS}`;
  x.fillText("Quantum Bracket", PAD + 16, 52);
  x.fillStyle = MUTE;
  x.font = `500 22px ${SANS}`;
  x.fillText("My 2026 World Cup", PAD + 16, 80);
  // headline odds (right aligned)
  x.textAlign = "right";
  x.fillStyle = QUANTUM;
  x.font = `700 34px ${SANS}`;
  x.fillText(d.headline, W - PAD - 16, 52);
  x.fillStyle = FAINT;
  x.font = `500 18px ${SANS}`;
  x.fillText(`${d.headlineLabel} · ${d.decided}/31 decided`, W - PAD - 16, 78);
  x.textAlign = "left";
  x.textBaseline = "middle";

  // column round headers
  x.fillStyle = FAINT;
  x.font = `600 14px ${SANS}`;
  x.textAlign = "center";
  for (let ci = 0; ci < 9; ci++) {
    x.fillStyle = ci === 4 ? GOLD : FAINT;
    x.fillText(ROUND_LABEL[ci], PAD + ci * COLW + COLW / 2, TOP - 16);
  }
  x.textAlign = "left";

  // connectors (child -> parent), drawn under the boxes
  x.strokeStyle = LINE;
  x.lineWidth = 2;
  for (const n of d.nodes) {
    if (n.level >= 5) continue;
    const r = rectOf(n.level, n.start);
    const pStart = (n.start >> (n.level + 1)) << (n.level + 1);
    const p = rectOf(n.level + 1, pStart);
    const fromX = r.side === 0 ? r.x + BOXW : r.x;
    const toX = r.side === 0 ? p.x : p.x + BOXW;
    const midX = (fromX + toX) / 2;
    x.beginPath();
    x.moveTo(fromX, r.cy);
    x.lineTo(midX, r.cy);
    x.lineTo(midX, p.cy);
    x.lineTo(toX, p.cy);
    x.stroke();
  }

  const name = (id: number) => d.teams[id]?.name ?? "?";
  const flag = (id: number) => d.teams[id]?.flag ?? "";

  const drawBox = (level: number, start: number, aId: number, bId: number, winnerId: number) => {
    const { x: bx, cy } = rectOf(level, start);
    const top = cy - BOXH / 2;
    roundRect(x, bx, top, BOXW, BOXH, 10);
    x.fillStyle = PANEL;
    x.fill();
    x.strokeStyle = LINE;
    x.lineWidth = 1.5;
    x.stroke();

    const rowH = BOXH / 2;
    const rows: [number, number][] = [
      [aId, top + rowH / 2],
      [bId, top + rowH + rowH / 2],
    ];
    x.font = `600 16px ${SANS}`;
    for (const [id, ry] of rows) {
      const isWin = id === winnerId;
      if (isWin) {
        roundRect(x, bx + 3, ry - rowH / 2 + 3, BOXW - 6, rowH - 6, 7);
        x.fillStyle = "rgba(109,94,252,0.22)";
        x.fill();
      }
      x.fillStyle = isWin ? WHITE : FAINT;
      const label = `${flag(id)}  ${name(id)}`;
      x.fillText(trunc(x, label, BOXW - 24), bx + 12, ry + 1);
    }
  };

  // every match (R32 .. Final)
  for (const n of d.nodes) drawBox(n.level, n.start, n.aId, n.bId, n.winnerId);

  // champion ribbon under the final (wide enough for the flag + a long name)
  const fin = rectOf(5, 0);
  const cx = fin.x + BOXW / 2;
  const ribbonW = COLW * 1.9;
  const cyChamp = fin.cy + BOXH / 2 + 56;
  roundRect(x, cx - ribbonW / 2, cyChamp - 36, ribbonW, 72, 14);
  x.fillStyle = "rgba(216,168,56,0.12)";
  x.fill();
  x.strokeStyle = "rgba(216,168,56,0.5)";
  x.lineWidth = 2;
  x.stroke();
  // NB: canvas mis-measures flag-emoji width, so centering a "flag + name" string
  // anchors it off-center. Instead we center the *text* and place the emoji to its
  // left using textAlign:"right" — keeping the label/name visually centered.
  x.fillStyle = GOLD;
  x.font = `700 12px ${SANS}`;
  x.textAlign = "center";
  x.fillText("CHAMPION", cx, cyChamp - 16);
  x.textAlign = "right";
  x.fillText("🏆", cx - x.measureText("CHAMPION").width / 2 - 4, cyChamp - 16);

  // champion name: shrink to fit, centered; flag sits just to its left
  const champName = name(d.championId);
  const maxW = ribbonW - 90; // leave room for the flag + padding on the left
  let fs = 24;
  do { x.font = `700 ${fs}px ${SANS}`; } while (x.measureText(champName).width > maxW && --fs > 15);
  const nm = trunc(x, champName, maxW);
  x.fillStyle = WHITE;
  x.textAlign = "center";
  x.fillText(nm, cx, cyChamp + 14);
  const nameLeft = cx - x.measureText(nm).width / 2;
  x.font = `${fs - 2}px ${SANS}`;
  x.textAlign = "right";
  x.fillText(flag(d.championId), nameLeft - 10, cyChamp + 14);

  // footer url
  x.textAlign = "right";
  x.fillStyle = FAINT;
  x.font = `400 18px ${SANS}`;
  x.fillText("world-cup-2026-quantum-bracket.vercel.app", W - PAD - 16, H - 22);
  x.textAlign = "left";
}

export function downloadBracketCard(d: BracketCard): void {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  if (!x) return;
  drawBracketCard(x, d);

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
