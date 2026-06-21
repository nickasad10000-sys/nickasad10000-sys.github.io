const { chromium } = require('playwright');

(async () => {
  console.log('🧪 TITAN AI - Test Browser');
  console.log('==========================');
  
  console.log('🌐 Launching Chromium...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('📱 Opening Google...');
  await page.goto('https://google.com', { waitUntil: 'networkidle' });
  console.log('✅ Page title:', await page.title());
  
  await page.screenshot({ path: 'logs/test.png' });
  console.log('📸 Screenshot saved to logs/test.png');
  
  await browser.close();
  console.log('✅ Test passed! Playwright is working correctly.');
})();
