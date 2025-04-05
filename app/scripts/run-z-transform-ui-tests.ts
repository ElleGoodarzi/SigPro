/**
 * Test runner for the Z-transform UI component tests
 * Run with: npm run test:z-transform-ui
 */

// Import test runner
const { runUITests } = require('../tests/z-transform-ui-test');

// Display welcome message
console.log('-'.repeat(50));
console.log('Z-Transform UI Component Tests');
console.log('-'.repeat(50));

// Run the tests
runUITests();

// Display completion message
console.log('-'.repeat(50));
console.log('UI Tests execution completed');
console.log('-'.repeat(50)); 