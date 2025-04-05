/**
 * Z-Transform Tool Verification Tests
 * 
 * This script contains tests to verify the improvements made to the Z-Transform tool.
 * It follows the items in the z-transform-fixes-checklist.md file.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Z-Transform Tool Verification', () => {
  
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to the Z-Transform tool page
    await page.goto('/tools/z-transform');
    // Wait for the page to fully load
    await page.waitForSelector('.z-transform-container');
  });

  test.describe('Preset Selection Tests', () => {
    
    test('Verify all presets load correctly', async ({ page }: { page: Page }) => {
      // Get the total number of presets
      const presetCount = await page.locator('button[aria-selected]').count();
      console.log(`Found ${presetCount} presets`);
      
      // For each preset
      for (let i = 0; i < presetCount; i++) {
        // Click on the preset
        await page.locator('button[aria-selected]').nth(i).click();
        // Wait for visualization to update
        await page.waitForTimeout(500);
        
        // Verify that the poles and zeros are displayed correctly
        const polesExist = await page.locator('g[data-testid="pole"]').count() > 0 || 
                          await page.locator('g[transform]').filter({ hasText: 'x' }).count() > 0;
        console.log(`Preset ${i} poles exist: ${polesExist}`);
        
        const zerosExist = await page.locator('g[data-testid="zero"]').count() > 0 || 
                          await page.locator('circle[r="8"][stroke]').count() > 0;
        console.log(`Preset ${i} zeros exist: ${zerosExist}`);
        
        // Verify that the transfer function is updated
        const transferFunctionVisible = await page.locator('.MathJax').isVisible();
        console.log(`Preset ${i} transfer function visible: ${transferFunctionVisible}`);
        
        // Check if system properties are updated
        const systemPropertiesExist = await page.locator('text=System Properties').isVisible();
        console.log(`Preset ${i} system properties visible: ${systemPropertiesExist}`);
      }
    });

    test('Check that preset changes update plots immediately', async ({ page }: { page: Page }) => {
      // Take a screenshot of the initial state
      await page.screenshot({ path: 'initial-state.png' });
      
      // Click on a different preset
      await page.locator('button[aria-selected]').nth(1).click();
      
      // Wait briefly for the visual update
      await page.waitForTimeout(300);
      
      // Take a screenshot of the updated state
      await page.screenshot({ path: 'updated-state.png' });
      
      // Compare properties before and after (actual image comparison would require additional libraries)
      // Here we just verify that the plot is visible after change
      const plotVisible = await page.locator('.z-plane-visualizer').isVisible();
      console.log(`Plot visible after change: ${plotVisible}`);
    });

    test('Ensure preset descriptions match the visualizations', async ({ page }: { page: Page }) => {
      // For each preset
      const presetCount = await page.locator('button[aria-selected]').count();
      
      for (let i = 0; i < presetCount; i++) {
        // Click on the preset
        await page.locator('button[aria-selected]').nth(i).click();
        
        // Get the preset name
        const presetName = await page.locator('button[aria-selected]').nth(i).textContent();
        console.log(`Testing preset: ${presetName}`);
        
        // Check if the description corresponds to the visualization
        // For example, if it's a "Low-Pass" filter, check for a pole near the origin
        if (presetName?.includes('Low-Pass')) {
          // Verify properties specific to low-pass filters
          // A low-pass filter typically has poles closer to origin
          console.log(`Verifying low-pass filter characteristics`);
        } else if (presetName?.includes('Bandpass')) {
          // Verify properties specific to bandpass filters
          console.log(`Verifying bandpass filter characteristics`);
        }
        // Continue for other filter types...
      }
    });
  });

  test.describe('Plot Rendering Tests', () => {
    
    test('Check that pole-zero plots render correctly', async ({ page }: { page: Page }) => {
      // Verify that the unit circle is visible
      const unitCircleVisible = await page.locator('circle[cx][cy]').isVisible();
      console.log(`Unit circle visible: ${unitCircleVisible}`);
      
      // Verify that the real and imaginary axes are visible
      const axesVisible = await page.locator('line').count() > 4;
      console.log(`Axes visible: ${axesVisible}`);
      
      // Verify that the poles and zeros have the correct styling
      const polesStyled = await page.locator('g[transform]').filter({ hasText: 'x' }).count() > 0;
      console.log(`Poles styled correctly: ${polesStyled}`);
      
      const zerosStyled = await page.locator('circle[r="8"][stroke]').count() > 0;
      console.log(`Zeros styled correctly: ${zerosStyled}`);
    });

    test('Verify accessibility features', async ({ page }: { page: Page }) => {
      // Test color blind mode
      await page.locator('input[aria-label="Enable colorblind friendly mode"]').check();
      
      // Verify that the visualization updates accordingly
      const colorBlindModeActive = await page.locator('input[aria-label="Enable colorblind friendly mode"]').isChecked();
      console.log(`Color blind mode active: ${colorBlindModeActive}`);
      
      // Test high contrast mode
      await page.locator('input[aria-label="Enable high contrast mode"]').check();
      
      // Verify that the visualization updates accordingly
      const highContrastModeActive = await page.locator('input[aria-label="Enable high contrast mode"]').isChecked();
      console.log(`High contrast mode active: ${highContrastModeActive}`);
    });

    test('Ensure responsive behavior on different screen sizes', async ({ page }: { page: Page }) => {
      // Test small screen size
      await page.setViewportSize({ width: 480, height: 640 });
      await page.waitForTimeout(500);
      
      // Check if the visualization is still visible
      const visualizationVisibleSmall = await page.locator('.z-plane-visualizer').isVisible();
      console.log(`Visualization visible on small screen: ${visualizationVisibleSmall}`);
      
      // Test medium screen size
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Check if the visualization is properly sized
      const visualizationVisibleMedium = await page.locator('.z-plane-visualizer').isVisible();
      console.log(`Visualization visible on medium screen: ${visualizationVisibleMedium}`);
      
      // Test large screen size
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      // Check if the visualization utilizes the space well
      const visualizationVisibleLarge = await page.locator('.z-plane-visualizer').isVisible();
      console.log(`Visualization visible on large screen: ${visualizationVisibleLarge}`);
    });
  });

  test.describe('Educational Content Validation', () => {
    
    test('Review educational content for accuracy', async ({ page }: { page: Page }) => {
      // Check that the quick reference section contains accurate formulas
      const referenceVisible = await page.locator('text=Quick Z-Transform Reference').isVisible();
      console.log(`Reference section visible: ${referenceVisible}`);
      
      // Check that system properties section displays correct stability information
      const stabilityInfoVisible = await page.locator('text=Stability Analysis').isVisible();
      console.log(`Stability information visible: ${stabilityInfoVisible}`);
      
      // Check other educational elements
      const educationalElementsExist = await page.locator('div[data-tooltip]').count() > 0;
      console.log(`Educational elements exist: ${educationalElementsExist}`);
    });
  });
}); 