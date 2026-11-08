import type { Quiz } from './types';
import type { ConsultingReport } from './consulting-engine';

export function buildResultPost(quiz: Quiz, report: ConsultingReport, introductionUrl: string): string {
  return [
    `我完成了「${quiz.title}」的 28 道顧問入場闖關！`,
    `本次 ${report.score} / 100 分｜${report.tier.label}`,
    '',
    report.axes.map(axis => `${axis.name} ${axis.score}`).join(' · '),
    '',
    '帶著我的顧問入場券，繼續升級！你也來挑戰看看：',
    introductionUrl,
    '',
    '趣味模擬，非官方招募；這是本次闖關表現，不代表實際錄取資格。',
    '#顧問入場闖關 #AI助攻 #職涯探索',
  ].join('\n');
}

export function canShareResult(file: File, title: string, text: string): boolean {
  try { return typeof navigator.share === 'function' && navigator.canShare?.({ files: [file], title, text }) === true; }
  catch { return false; }
}

/** Called directly from a click, after the image is prepared, to retain user activation. */
export async function shareResult(file: File, title: string, text: string): Promise<'handed-off' | 'cancelled' | 'unsupported'> {
  if (!canShareResult(file, title, text)) return 'unsupported';
  try {
    await navigator.share({ files: [file], title, text });
    return 'handed-off';
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

/** Export a personal admission ticket using the same illustration and report as the result page. */
export async function createResultImage(quiz: Quiz, report: ConsultingReport, introductionUrl: string): Promise<File> {
  const illustration = new Image();
  illustration.src = `${import.meta.env.BASE_URL}images/ai-consulting/pitch.webp`;
  await illustration.decode();
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image export unavailable');
  const ink = '#202b40'; const blue = '#234ddd'; const cream = '#fff8e7';
  const font = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  function box(x: number, y: number, width: number, height: number, fill: string, radius = 24) {
    ctx!.beginPath();
    ctx!.roundRect(x, y, width, height, radius);
    ctx!.fillStyle = fill; ctx!.fill();
    ctx!.strokeStyle = ink; ctx!.lineWidth = 3; ctx!.stroke();
  }
  function text(value: string, x: number, y: number, size: number, weight = 500, color = ink) {
    ctx!.font = `${weight} ${size}px ${font}`; ctx!.fillStyle = color; ctx!.fillText(value, x, y);
  }
  function lines(value: string, x: number, y: number, width: number, size: number, height: number, weight = 700) {
    ctx!.font = `${weight} ${size}px ${font}`;
    let line = ''; let baseline = y;
    for (const character of value) {
      if (line && ctx!.measureText(line + character).width > width) {
        text(line, x, baseline, size, weight); baseline += height; line = '';
      }
      line += character;
    }
    if (line) text(line, x, baseline, size, weight);
    return baseline;
  }
  ctx.fillStyle = cream; ctx.fillRect(0, 0, canvas.width, canvas.height);
  box(40, 40, 1120, 1320, '#fffdf7', 32);
  text(quiz.title, 88, 128, 44, 800);
  text('我的顧問入場券 · 本次闖關成績單', 88, 194, 32, 600, blue);
  // Preserve the full illustration's aspect ratio; no filtering or cropping.
  const imageWidth = 544; const imageHeight = imageWidth * illustration.naturalHeight / illustration.naturalWidth;
  ctx.drawImage(illustration, 88, 244, imageWidth, imageHeight);
  box(656, 244, 456, imageHeight, '#ffdf7c');
  text('本次闖關分數', 692, 312, 32, 700);
  text(String(report.score), 692, 454, 132, 800, blue);
  const scoreWidth = ctx.measureText(String(report.score)).width;
  text('/ 100', 704 + scoreWidth, 454, 36, 600, blue);
  text(`${report.earned} / ${report.maximum} 闖關積分`, 692, 524, 30, 600);
  const labelBottom = lines(report.tier.label, 88, 702, 1024, 52, 70, 800);
  lines(report.tier.target, 88, Math.max(806, labelBottom + 72), 1024, 30, 46, 500);
  report.axes.forEach((axis, index) => {
    const x = 88 + (index % 3) * 352; const y = 936 + Math.floor(index / 3) * 128;
    box(x, y, 320, 104, index % 2 ? '#eef1ff' : '#fff0ba', 16);
    text(axis.name, x + 20, y + 40, 30, 700);
    text(`${axis.score} / 100`, x + 20, y + 82, 32, 800, blue);
  });
  text('趣味模擬 · 非官方招募 · 不代表實際錄取資格', 88, 1242, 30, 500);
  lines(`你也來挑戰：${introductionUrl.replace(/^https?:\/\//, '')}`, 88, 1294, 1024, 30, 38, 700);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed')), 'image/png'));
  return new File([blob], `consultant-result-${report.score}.png`, { type: 'image/png' });
}
