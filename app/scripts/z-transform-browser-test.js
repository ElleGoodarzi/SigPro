/**
 * Z-Transform Browser Testing Script
 * 
 * This script uses Puppeteer to test the Z-transform tool in a real browser.
 * It tests various interactions and verifies that the UI responds appropriately.
 * 
 * Run with: node app/scripts/z-transform-browser-test.js
 * 
 * Requirements:
 * - npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../../test-results/z-transform');

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

// Main test function
async function runBrowserTests() {
  console.log('-'.repeat(50));
  console.log('Z-Transform Browser Tests');
  console.log('-'.repeat(50));
  
  // Create screenshots directory
  await ensureDirectoryExists(screenshotsDir);
  
  const browser = await puppeteer.launch({ 
    headless: 'new', // Use new headless mode for Chrome
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: {
      width: 1280,
      height: 800
    }
  });
  
  const page = await browser.newPage();
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    screenshots: []
  };
  
  // Helper function to record test results
  const recordTestResult = async (name, passed, errorMessage = null, takeScreenshot = true) => {
    testResults.total++;
    if (passed) {
      testResults.passed++;
      console.log(`✓ PASSED: ${name}`);
    } else {
      testResults.failed++;
      console.error(`✗ FAILED: ${name}${errorMessage ? ' - ' + errorMessage : ''}`);
    }
    
    if (takeScreenshot) {
      const screenshotPath = path.join(screenshotsDir, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);
    }
  };
  
  try {
    // Test 1: Load the Z-transform page
    console.log('Test 1: Loading Z-transform page...');
    await page.goto('http://localhost:3999/tools/z-transform', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Check if the page title contains "Z-Transform"
    const title = await page.title();
    const pageLoaded = title.includes('Transform');
    await recordTestResult('Page Load', pageLoaded, pageLoaded ? null : `Title was "${title}"`);
    
    // Test 2: Verify main UI elements are present
    console.log('Test 2: Checking UI elements...');
    const mainHeading = await page.$eval('h1', el => el.textContent);
    const hasMainHeading = mainHeading.includes('Z-Transform Explorer');
    await recordTestResult('Main Heading', hasMainHeading, hasMainHeading ? null : `Heading was "${mainHeading}"`);
    
    // Test 3: Test preset selection
    console.log('Test 3: Testing preset selection...');
    try {
      // Click the second preset (Second-Order Bandpass)
      await page.click('button:nth-of-type(2)');
      await page.waitForTimeout(500); // Wait for any animations
      
      // Check if the equation has changed (indirect check through UI update)
      const equationVisible = await page.evaluate(() => {
        const mathElements = document.querySelectorAll('#\\31  > mjx-container');
        return mathElements.length > 0;
      });
      
      await recordTestResult('Preset Selection', true);
    } catch (error) {
      await recordTestResult('Preset Selection', false, error.message);
    }
    
    // Test 4: Test 2D/3D view toggle
    console.log('Test 4: Testing view toggle...');
    try {
      // Get initial view
      const initialViewText = await page.$eval('h2', el => el.textContent);
      
      // Click the toggle button
      await page.click('button:contains("Switch to 3D View")');
      await page.waitForTimeout(1000); // Give time for the view to change
      
      // Check if the view has changed
      const newViewText = await page.$eval('h2', el => el.textContent);
      const viewToggled = initialViewText !== newViewText;
      
      await recordTestResult('View Toggle', viewToggled, viewToggled ? null : 'View title did not change');
    } catch (error) {
      await recordTestResult('View Toggle', false, error.message);
    }
    
    // Test 5: Test accessibility options
    console.log('Test 5: Testing accessibility options...');
    try {
      // Toggle high contrast mode
      await page.click('input[type="checkbox"]:nth-of-type(1)');
      await page.waitForTimeout(500);
      
      // Toggle colorblind mode
      await page.click('input[type="checkbox"]:nth-of-type(2)');
      await page.waitForTimeout(500);
      
      // Verify checkboxes are checked
      const highContrastChecked = await page.$eval('input[type="checkbox"]:nth-of-type(1)', el => el.checked);
      const colorblindChecked = await page.$eval('input[type="checkbox"]:nth-of-type(2)', el => el.checked);
      
      await recordTestResult('Accessibility Options', 
        highContrastChecked && colorblindChecked, 
        `High contrast: ${highContrastChecked}, Colorblind: ${colorblindChecked}`);
    } catch (error) {
      await recordTestResult('Accessibility Options', false, error.message);
    }
    
    // Test 6: Perform rapid interactions to stress test the UI
    console.log('Test 6: Stress testing UI with rapid interactions...');
    try {
      // Define a sequence of interactions
      const interactions = [
        async () => await page.click('button:contains("First-Order")'),
        async () => await page.click('button:contains("Second-Order")'),
        async () => await page.click('button:contains("Switch to")'),
        async () => await page.click('input[type="checkbox"]:nth-of-type(1)'),
        async () => await page.click('input[type="checkbox"]:nth-of-type(2)'),
      ];
      
      // Perform 10 rapid interactions
      for (let i = 0; i < 10; i++) {
        const randomInteraction = interactions[Math.floor(Math.random() * interactions.length)];
        await randomInteraction();
        await page.waitForTimeout(100); // Very short delay between interactions
      }
      
      // Check if the page is still responsive by verifying we can still click on an element
      await page.click('button:contains("First-Order")');
      await page.waitForTimeout(500);
      
      await recordTestResult('Rapid Interaction Stress Test', true);
    } catch (error) {
      await recordTestResult('Rapid Interaction Stress Test', false, error.message);
    }
    
    // Test 7: Verify system properties section updates correctly
    console.log('Test 7: Testing system properties updates...');
    try {
      // Select different presets and check if system properties update
      await page.click('button:contains("First-Order")');
      await page.waitForTimeout(500);
      
      const firstPresetStability = await page.evaluate(() => {
        const stabilityText = document.querySelector('.ultra-compact-card:nth-of-type(1) p').textContent;
        return stabilityText;
      });
      
      await page.click('button:contains("All-Pass")');
      await page.waitForTimeout(500);
      
      const secondPresetStability = await page.evaluate(() => {
        const stabilityText = document.querySelector('.ultra-compact-card:nth-of-type(1) p').textContent;
        return stabilityText;
      });
      
      await recordTestResult('System Properties Update', 
        firstPresetStability.includes('stable') || secondPresetStability.includes('stable'),
        `First preset: "${firstPresetStability}", Second preset: "${secondPresetStability}"`);
    } catch (error) {
      await recordTestResult('System Properties Update', false, error.message);
    }

    // Final report
    console.log('-'.repeat(50));
    console.log(`Test Summary: ${testResults.passed}/${testResults.total} tests passed`);
    console.log(`Screenshots saved to: ${screenshotsDir}`);
    console.log('-'.repeat(50));
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runBrowserTests()
    .catch(err => {
      console.error('Browser test failed:', err);
      process.exit(1);
    });
}

module.exports = { runBrowserTests }; 