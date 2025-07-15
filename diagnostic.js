// Diagnostic script to check blur feature status
console.log('=== BLUR FEATURE DIAGNOSTIC ===');

// Check if scripts are loaded
console.log('1. Script Loading Status:');
console.log('   - window.simpleBlur:', typeof window.simpleBlur);
console.log('   - window.blurFeature:', typeof window.blurFeature);
console.log('   - window.manualBlurTests:', typeof window.manualBlurTests);

// Check if DOM elements exist
console.log('2. DOM Elements:');
console.log('   - #blurStep:', document.getElementById('blurStep') ? 'Found' : 'Not found');
console.log('   - #blurFeatureSection:', document.getElementById('blurFeatureSection') ? 'Found' : 'Not found');
console.log('   - #canvas:', document.getElementById('canvas') ? 'Found' : 'Not found');
console.log('   - #blurOverlay:', document.getElementById('blurOverlay') ? 'Found' : 'Not found');
console.log('   - #toggleBlurMode:', document.getElementById('toggleBlurMode') ? 'Found' : 'Not found');

// Check if functions exist
console.log('3. Global Functions:');
const expectedFunctions = ['toggleBlurMode', 'clearAllBlurRegions', 'toggleBlurPreview', 'updateBlurIntensity'];
expectedFunctions.forEach(func => {
    console.log(`   - ${func}:`, typeof window[func]);
});

// Check blur step visibility
const blurStep = document.getElementById('blurStep');
if (blurStep) {
    console.log('4. Blur Step Status:');
    console.log('   - Display:', blurStep.style.display);
    console.log('   - Computed display:', getComputedStyle(blurStep).display);
}

// Try to initialize if not already done
if (window.simpleBlur && typeof window.simpleBlur.init === 'function') {
    console.log('5. Attempting simpleBlur initialization...');
    try {
        const result = window.simpleBlur.init();
        console.log('   - Initialization result:', result);
    } catch (error) {
        console.log('   - Initialization error:', error);
    }
}

// Test basic functionality
console.log('6. Running basic tests...');
if (window.manualBlurTests && typeof window.manualBlurTests.runAllTests === 'function') {
    try {
        window.manualBlurTests.runAllTests();
    } catch (error) {
        console.log('   - Test error:', error);
    }
} else {
    console.log('   - Manual tests not available');
}

console.log('=== DIAGNOSTIC COMPLETE ===');
