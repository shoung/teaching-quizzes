// Import in ego-browser nodejs and pass the existing TaskSpace plus the absolute repo path.
export async function runAudit(task, root, base = 'http://127.0.0.1:5173/') {
const fs = await import('node:fs/promises');
const { pathToFileURL } = await import('node:url');
const { inspectPage } = await import(pathToFileURL(`${root}/scripts/a11y/inspect-page.mjs`).href);
const axeSource = await fs.readFile(`${root}/node_modules/axe-core/axe.min.js`, 'utf8');
const page = task.page('p1');
const reports = [];
const questions = [];

async function audit(name) {
  await page.evaluate(axeSource);
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
    return {
      violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help,
        nodes: v.nodes.map((n) => ({ target: n.target, reason: n.failureSummary })) })),
      incomplete: r.incomplete.map((v) => ({ id: v.id, count: v.nodes.length })),
      passes: r.passes.length,
    };
  });
  const layout = await page.evaluate(inspectPage);
  reports.push({ name, ...layout, axe });
  console.log({ name, minimumFont: layout.minimumFont, lowContrast: layout.lowContrast.length,
    overflow: layout.scrollWidth > layout.width, smallTargets: layout.smallTargets.length,
    axe: axe.violations.map((v) => v.id), homeLinks: layout.homeLinks.length });
}

await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1360, height: 1000, deviceScaleFactor: 1, mobile: false });
await page.goto(base);
await audit('home-desktop');
await page.cdp('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
await audit('home-320');
await page.fill('loc=role:searchbox[name="搜尋測驗"]', '完全不存在的主題');
await audit('home-empty-search');

const cases = [
  { id: 'chromatic-intuition', answers: [1, 3, 0, 1, 0, 0, [0, 1, 2, 4], 3, 0, 0, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, [0, 2], 0, 0, 3, 1, 3, 0, 0] },
  { id: 'ai-consulting', answers: [2, 0, 3, 1, 2, 0, 1, 3, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 0, 3, 1, 2, 0, 3, 2, 0, 3, 1] },
];
for (const quiz of cases) {
  // Only reset the synthetic test sessions created by this audit on localhost.
  if (!base.startsWith('http://127.0.0.1:')) throw new Error('Full synthetic flow is limited to localhost.');
  await page.evaluate((id) => Object.keys(localStorage).filter((key) => key.startsWith(`learning-lab:quiz:${id}:v`)).forEach((key) => localStorage.removeItem(key)), quiz.id);
  await page.goto(`${base}#/quiz/${quiz.id}/1`);
  await page.reload();
  await audit(`${quiz.id}-landing-320`);
  await page.cdp('Emulation.setDeviceMetricsOverride', { width: 1360, height: 1000, deviceScaleFactor: 1, mobile: false });
  await audit(`${quiz.id}-landing-desktop`);
  await page.click('loc=role:button[name="開始測驗"]');
  await page.waitForSelector('loc=css:.answer-options');
  await page.cdp('Emulation.setDeviceMetricsOverride', { width: 320, height: 800, deviceScaleFactor: 1, mobile: true });
  await audit(`${quiz.id}-question`);
  for (let index = 0; index < quiz.answers.length; index++) {
    const current = await page.evaluate(inspectPage);
    questions.push({ quiz: quiz.id, question: index + 1, minimumFont: current.minimumFont,
      lowContrast: current.lowContrast, overflow: current.scrollWidth > current.width,
      homeLinks: current.homeLinks, smallTargets: current.smallTargets });
    for (const selected of Array.isArray(quiz.answers[index]) ? quiz.answers[index] : [quiz.answers[index]]) {
      await page.evaluate((n) => document.querySelectorAll('.answer-options input')[n].click(), selected);
    }
    await page.waitForFunction(() => !document.querySelector('.question-navigation .primary').disabled);
    if ([0, 6, 20].includes(index)) await audit(`${quiz.id}-selected-${index + 1}`);
    await page.evaluate(() => document.querySelector('.question-navigation .primary').click());
    if (index < 27) await page.waitForFunction((n) => Number(document.querySelector('.question-progress b')?.textContent) === n, index + 2);
    else await page.waitForSelector('loc=css:.result-page, .adventure-result');
  }
  await audit(`${quiz.id}-result`);
  await page.evaluate(() => document.querySelectorAll('.review-item').forEach((d) => { d.open = true; }));
  await audit(`${quiz.id}-expanded-review`);
}
await page.goto(`${base}#/quiz/does-not-exist/1`);
await audit('invalid-quiz');
await fs.writeFile(`${root}/docs/accessibility/adventure-runtime.json`, JSON.stringify(reports, null, 2) + '\n');
await fs.writeFile(`${root}/docs/accessibility/adventure-questions-runtime.json`, JSON.stringify(questions, null, 2) + '\n');
const failed = reports.filter((r) => r.axe.violations.length || r.lowContrast.length || r.smallText.length || r.smallTargets.length || r.scrollWidth > r.width);
const failedQuestions = questions.filter((q) => q.minimumFont < 16 || q.lowContrast.length || q.overflow || q.homeLinks.length || q.smallTargets.length);
console.log({ auditedStates: reports.length, auditedQuestions: questions.length, failedStates: failed.length, failedQuestions: failedQuestions.length });
if (failed.length || failedQuestions.length) throw new Error('Accessibility regression found; inspect saved reports.');

}
