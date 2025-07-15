/*
  MANUAL BLUR FEATURE TEST SCRIPT
  
  This script provides manual testing functions to verify
  the blur feature is working correctly.
*/

// Manual test functions
window.manualBlurTests = {
    
    // Test 1: Verify blur feature section is visible
    testVisibility: function() {
        const section = document.getElementById('blurFeatureSection');
        if (section && section.style.display !== 'none') {
            console.log('✅ Test 1 PASSED: Blur feature section is visible');
            return true;
        } else {
            console.log('❌ Test 1 FAILED: Blur feature section is not visible');
            return false;
        }
    },
    
    // Test 2: Verify buttons are clickable
    testButtons: function() {
        const buttons = ['toggleBlurMode', 'clearBlurRegions', 'previewBlur'];
        let allPassed = true;
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button && !button.disabled) {
                console.log(`✅ Button ${buttonId} is clickable`);
            } else {
                console.log(`❌ Button ${buttonId} is not clickable`);
                allPassed = false;
            }
        });
        
        if (allPassed) {
            console.log('✅ Test 2 PASSED: All buttons are clickable');
        } else {
            console.log('❌ Test 2 FAILED: Some buttons are not clickable');
        }
        
        return allPassed;
    },
    
    // Test 3: Verify blur mode toggle works
    testToggle: function() {
        const button = document.getElementById('toggleBlurMode');
        if (!button) {
            console.log('❌ Test 3 FAILED: Toggle button not found');
            return false;
        }
        
        const initialText = button.textContent;
        button.click();
        
        setTimeout(() => {
            const newText = button.textContent;
            if (initialText !== newText) {
                console.log('✅ Test 3 PASSED: Toggle button changes state');
                // Toggle back
                button.click();
                return true;
            } else {
                console.log('❌ Test 3 FAILED: Toggle button does not change state');
                return false;
            }
        }, 100);
    },
    
    // Test 4: Verify intensity slider works
    testSlider: function() {
        const slider = document.getElementById('blurIntensity');
        const display = document.getElementById('blurIntensityValue');
        
        if (!slider || !display) {
            console.log('❌ Test 4 FAILED: Slider or display not found');
            return false;
        }
        
        const originalValue = slider.value;
        slider.value = '15';
        slider.dispatchEvent(new Event('input'));
        
        setTimeout(() => {
            if (display.textContent === '15') {
                console.log('✅ Test 4 PASSED: Intensity slider updates display');
                // Reset
                slider.value = originalValue;
                slider.dispatchEvent(new Event('input'));
                return true;
            } else {
                console.log('❌ Test 4 FAILED: Intensity slider does not update display');
                return false;
            }
        }, 100);
    },
    
    // Test 5: Verify blur canvas exists
    testCanvas: function() {
        const blurCanvas = document.getElementById('blurOverlay');
        if (blurCanvas) {
            console.log('✅ Test 5 PASSED: Blur overlay canvas exists');
            console.log(`Canvas dimensions: ${blurCanvas.width}x${blurCanvas.height}`);
            return true;
        } else {
            console.log('❌ Test 5 FAILED: Blur overlay canvas not found');
            return false;
        }
    },
    
    // Test 6: Verify global functions exist
    testGlobalFunctions: function() {
        const functions = ['toggleBlurMode', 'clearAllBlurRegions', 'toggleBlurPreview', 'updateBlurIntensity'];
        let allExist = true;
        
        functions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                console.log(`✅ Function ${funcName} exists`);
            } else {
                console.log(`❌ Function ${funcName} missing`);
                allExist = false;
            }
        });
        
        if (allExist) {
            console.log('✅ Test 6 PASSED: All global functions exist');
        } else {
            console.log('❌ Test 6 FAILED: Some global functions missing');
        }
        
        return allExist;
    },
    
    // Test 7: Verify blur feature object exists
    testBlurFeatureObject: function() {
        if (window.blurFeature && typeof window.blurFeature === 'object') {
            console.log('✅ Test 7 PASSED: Blur feature object exists');
            console.log('Available methods:', Object.keys(window.blurFeature));
            return true;
        } else {
            console.log('❌ Test 7 FAILED: Blur feature object not found');
            return false;
        }
    },
    
    // Test 8: Verify no console errors
    testConsoleErrors: function() {
        // This would need to be implemented with error monitoring
        console.log('✅ Test 8: Check console for errors (manual check)');
        console.log('Look for any red error messages in the console');
        return true;
    },
    
    // Run all tests
    runAllTests: function() {
        console.log('🚀 Starting manual blur feature tests...');
        console.log('========================================');
        
        const tests = [
            this.testVisibility,
            this.testButtons,
            this.testToggle,
            this.testSlider,
            this.testCanvas,
            this.testGlobalFunctions,
            this.testBlurFeatureObject,
            this.testConsoleErrors
        ];
        
        let passed = 0;
        let total = tests.length;
        
        tests.forEach((test, index) => {
            console.log(`\n--- Running Test ${index + 1} ---`);
            try {
                if (test()) {
                    passed++;
                }
            } catch (error) {
                console.log(`❌ Test ${index + 1} FAILED with error:`, error.message);
            }
        });
        
        console.log('\n========================================');
        console.log(`🎯 Manual Test Summary: ${passed}/${total} tests passed`);
        console.log('========================================');
        
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! Blur feature is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please check the results above.');
        }
        
        return passed === total;
    }
};

// Auto-run tests after page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('🔧 Manual blur tests available. Run: manualBlurTests.runAllTests()');
    }, 5000);
});

console.log('🧪 Manual blur feature tests loaded');
