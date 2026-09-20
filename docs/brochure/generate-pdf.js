const puppeteer = require('puppeteer');
const path = require('path');

const htmlPath = path.join(__dirname, 'Hostel-Management-System-Demo.html');
const pdfPath = path.join(__dirname, 'Hostel-Management-System-Demo.pdf');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();
  console.log('PDF created:', pdfPath);
})();
