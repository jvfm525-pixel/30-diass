const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const H = +(process.env.ALT || 1920); const p = await b.newPage({ viewport: { width: 1080, height: H }, deviceScaleFactor: 1 }); // VW: altura configurável (ALT=1080 p/ quadrado)
  for (const n of process.argv.slice(2)) { await p.goto('file://' + path.resolve(n + '.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300); await p.screenshot({ path: n + '-capa.png' }); console.log(n); }
  await b.close(); })();
