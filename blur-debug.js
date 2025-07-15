// Quick diagnostic script to check blur feature status
console.log('=== BLUR FEATURE DIAGNOSTIC ===');

// Check if scripts are loaded
console.log('1. Script Loading Status:');
console.log('   - window.simpleBlur:', typeof window.simpleBlur);
console.log('   - window.blurFeature:', typeof window.blurFeature);
console.log('   - window.manualBlurTests:', typeof window.manualBlurTests);

// Check DOM elements
console.log('2. DOM Elements:');
const blurStep = document.getElementById('blurStep');
console.log('   - #blurStep:', blurStep ? 'Found' : 'Not found');
if (blurStep) {
    console.log('   - blurStep display:', blurStep.style.display);
    console.log('   - blurStep computed display:', getComputedStyle(blurStep).display);
}

const blurFeatureSection = document.getElementById('blurFeatureSection');
console.log('   - #blurFeatureSection:', blurFeatureSection ? 'Found' : 'Not found');

const canvas = document.getElementById('canvas');
console.log('   - #canvas:', canvas ? 'Found' : 'Not found');

const blurOverlay = document.getElementById('blurOverlay');
console.log('   - #blurOverlay:', blurOverlay ? 'Found' : 'Not found');

const toggleBlurMode = document.getElementById('toggleBlurMode');
console.log('   - #toggleBlurMode:', toggleBlurMode ? 'Found' : 'Not found');

// Check functions
console.log('3. Global Functions:');
const expectedFunctions = ['toggleBlurMode', 'clearAllBlurRegions', 'toggleBlurPreview'];
expectedFunctions.forEach(func => {
    console.log(`   - ${func}:`, typeof window[func]);
});

// Check if blur feature is initialized
if (window.blurFeature) {
    console.log('4. Blur Feature Status:');
    console.log('   - enabled:', window.blurFeature.enabled);
    console.log('   - regions:', window.blurFeature.regions.length);
    console.log('   - intensity:', window.blurFeature.intensity);
}

// Try to initialize if not done
if (window.simpleBlur && typeof window.simpleBlur.init === 'function') {
    console.log('5. SimpleBlur Status:');
    try {
        const result = window.simpleBlur.init();
        console.log('   - initialized:', result);
    } catch (error) {
        console.log('   - error:', error.message);
    }
}

console.log('=== END DIAGNOSTIC ===');

// If manual tests are available, run them
if (window.manualBlurTests) {
    console.log('6. Running Manual Tests...');
    setTimeout(() => {
        window.manualBlurTests.runAllTests();
    }, 1000);
}
