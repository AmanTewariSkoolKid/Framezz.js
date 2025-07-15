/*
  BLUR FEATURE INTEGRATION HELPER
  This script provides a proper integration layer between the blur feature
  and the existing annotation tool.
*/

// Blur drawing state
let isDrawing = false;
let startX = 0;
let startY = 0;
let blurDrawingEnabled = false;

// Enable blur drawing functionality
function enableBlurDrawing() {
    const canvas = document.getElementById('canvas');
    const blurOverlay = document.getElementById('blurOverlay');
    
    if (!canvas || !blurOverlay) {
        console.warn('⚠️ Canvas elements not found for blur drawing');
        return;
    }
    
    // Make blur overlay interactive
    blurOverlay.style.pointerEvents = 'auto';
    blurOverlay.style.cursor = 'crosshair';
    
    // Add event listeners for drawing
    blurOverlay.addEventListener('mousedown', startBlurDrawing);
    blurOverlay.addEventListener('mousemove', drawBlurRegion);
    blurOverlay.addEventListener('mouseup', endBlurDrawing);
    blurOverlay.addEventListener('mouseleave', endBlurDrawing);
    
    blurDrawingEnabled = true;
    console.log('✅ Blur drawing enabled');
}

// Disable blur drawing functionality
function disableBlurDrawing() {
    const blurOverlay = document.getElementById('blurOverlay');
    
    if (blurOverlay) {
        blurOverlay.style.pointerEvents = 'none';
        blurOverlay.style.cursor = 'default';
        
        // Remove event listeners
        blurOverlay.removeEventListener('mousedown', startBlurDrawing);
        blurOverlay.removeEventListener('mousemove', drawBlurRegion);
        blurOverlay.removeEventListener('mouseup', endBlurDrawing);
        blurOverlay.removeEventListener('mouseleave', endBlurDrawing);
    }
    
    blurDrawingEnabled = false;
    isDrawing = false;
    console.log('❌ Blur drawing disabled');
}

// Start drawing a blur region
function startBlurDrawing(e) {
    if (!blurDrawingEnabled) return;
    
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.width / rect.width;
    const scaleY = e.target.height / rect.height;
    
    startX = (e.clientX - rect.left) * scaleX;
    startY = (e.clientY - rect.top) * scaleY;
    
    isDrawing = true;
    
    console.log('🎯 Started drawing blur region at:', startX, startY);
}

// Draw blur region preview
function drawBlurRegion(e) {
    if (!isDrawing || !blurDrawingEnabled) return;
    
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.width / rect.width;
    const scaleY = e.target.height / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    
    // Draw selection rectangle preview
    const blurOverlay = document.getElementById('blurOverlay');
    const ctx = blurOverlay.getContext('2d');
    
    // Clear previous preview
    ctx.clearRect(0, 0, blurOverlay.width, blurOverlay.height);
    
    // Draw selection rectangle
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(
        Math.min(startX, currentX),
        Math.min(startY, currentY),
        Math.abs(currentX - startX),
        Math.abs(currentY - startY)
    );
}

// End drawing and create blur region
function endBlurDrawing(e) {
    if (!isDrawing || !blurDrawingEnabled) return;
    
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.width / rect.width;
    const scaleY = e.target.height / rect.height;
    
    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;
    
    // Calculate region dimensions
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    
    // Only create region if it's large enough
    if (width > 10 && height > 10) {
        // Add blur region using simpleBlur
        if (window.simpleBlur && window.simpleBlur.addRegion) {
            const regionId = window.simpleBlur.addRegion(x, y, width, height, window.blurFeature.intensity);
            window.blurFeature.regions.push({
                id: regionId,
                x: x,
                y: y,
                width: width,
                height: height,
                intensity: window.blurFeature.intensity
            });
            
            // Update UI counter
            const count = document.getElementById('blurRegionCount');
            if (count) {
                count.textContent = `Blur regions: ${window.blurFeature.regions.length}`;
            }
            
            console.log('✅ Created blur region:', {x, y, width, height, intensity: window.blurFeature.intensity});
        } else {
            console.warn('⚠️ SimpleBlur not available for adding region');
        }
    }
    
    // Clear preview
    const blurOverlay = document.getElementById('blurOverlay');
    const ctx = blurOverlay.getContext('2d');
    ctx.clearRect(0, 0, blurOverlay.width, blurOverlay.height);
    
    isDrawing = false;
}

// Initialize blur feature integration
function initializeBlurFeature() {
    console.log('🔧 Initializing blur feature integration...');
    
    // Wait for simpleBlur to be available
    if (!window.simpleBlur) {
        console.log('⏳ Waiting for simpleBlur to load...');
        setTimeout(initializeBlurFeature, 500);
        return;
    }
    
    // Create blur feature compatibility layer
    window.blurFeature = {
        init: function() {
            try {
                if (window.simpleBlur && typeof window.simpleBlur.init === 'function') {
                    const result = window.simpleBlur.init();
                    console.log('✅ SimpleBlur initialized:', result);
                    return result;
                }
                return false;
            } catch (error) {
                console.error('❌ SimpleBlur initialization failed:', error);
                return false;
            }
        },
        regions: [],
        enabled: false,
        intensity: 10
    };
    
    // Initialize the blur system
    const initialized = window.blurFeature.init();
    
    if (initialized) {
        // Create the missing global functions that tests expect
        window.toggleBlurMode = function() {
            window.blurFeature.enabled = !window.blurFeature.enabled;
            const button = document.getElementById('toggleBlurMode');
            if (button) {
                button.textContent = window.blurFeature.enabled ? '❌ Disable Blur Mode' : '🎯 Enable Blur Mode';
                button.style.background = window.blurFeature.enabled ? '#f44336' : '#4CAF50';
            }
            const status = document.getElementById('blurModeStatus');
            if (status) {
                status.textContent = 'Mode: ' + (window.blurFeature.enabled ? 'Active' : 'Inactive');
            }
            
            // Enable/disable blur drawing
            if (window.blurFeature.enabled) {
                enableBlurDrawing();
            } else {
                disableBlurDrawing();
            }
            
            console.log('🔄 Blur mode:', window.blurFeature.enabled ? 'enabled' : 'disabled');
            return window.blurFeature.enabled;
        };
        
        window.clearAllBlurRegions = function() {
            try {
                if (window.clearBlurRegions) {
                    window.clearBlurRegions();
                }
                if (window.simpleBlur && window.simpleBlur.clearRegions) {
                    window.simpleBlur.clearRegions();
                }
                window.blurFeature.regions = [];
                
                // Clear the blur overlay canvas
                const blurOverlay = document.getElementById('blurOverlay');
                if (blurOverlay) {
                    const ctx = blurOverlay.getContext('2d');
                    ctx.clearRect(0, 0, blurOverlay.width, blurOverlay.height);
                }
                
                const count = document.getElementById('blurRegionCount');
                if (count) {
                    count.textContent = 'Blur regions: 0';
                }
                console.log('🧹 All blur regions cleared');
            } catch (error) {
                console.error('❌ Clear regions failed:', error);
            }
        };
        
        window.toggleBlurPreview = function() {
            try {
                if (window.toggleBlurVisibility) {
                    return window.toggleBlurVisibility();
                }
                if (window.simpleBlur && window.simpleBlur.toggleVisibility) {
                    return window.simpleBlur.toggleVisibility();
                }
                console.log('👁️ Blur preview toggled');
                return true;
            } catch (error) {
                console.error('❌ Toggle preview failed:', error);
                return false;
            }
        };
        
        // Set up UI event handlers
        setupBlurUIHandlers();
        
        // Show the blur step
        const blurStep = document.getElementById('blurStep');
        if (blurStep) {
            blurStep.style.display = 'list-item';
            console.log('👀 Blur step is now visible');
        }
        
        console.log('✅ Blur feature integration complete');
        return true;
    } else {
        console.warn('⚠️ Blur feature initialization failed');
        return false;
    }
}

// Set up UI event handlers
function setupBlurUIHandlers() {
    // Activation buttons
    const activateBlur = document.getElementById('activateBlur');
    const skipBlur = document.getElementById('skipBlur');
    const blurInterface = document.getElementById('blurInterface');
    
    if (activateBlur && skipBlur && blurInterface) {
        activateBlur.addEventListener('click', function() {
            blurInterface.style.display = 'block';
            activateBlur.style.display = 'none';
            skipBlur.style.display = 'none';
            console.log('🚀 Blur feature activated');
        });
        
        skipBlur.addEventListener('click', function() {
            const blurStep = document.getElementById('blurStep');
            if (blurStep) {
                blurStep.style.display = 'none';
            }
            console.log('⏭️ Blur feature skipped');
        });
    }
    
    // Function buttons
    const toggleBlurModeBtn = document.getElementById('toggleBlurMode');
    if (toggleBlurModeBtn) {
        toggleBlurModeBtn.addEventListener('click', function() {
            if (window.toggleBlurMode) {
                window.toggleBlurMode();
            }
        });
    }
    
    const clearRegionsBtn = document.getElementById('clearBlurRegions');
    if (clearRegionsBtn) {
        clearRegionsBtn.addEventListener('click', function() {
            if (window.clearAllBlurRegions) {
                window.clearAllBlurRegions();
            }
        });
    }
    
    const previewBtn = document.getElementById('previewBlur');
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            if (window.toggleBlurPreview) {
                window.toggleBlurPreview();
            }
        });
    }
    
    // Intensity slider
    const blurIntensity = document.getElementById('blurIntensity');
    const blurIntensityValue = document.getElementById('blurIntensityValue');
    
    if (blurIntensity && blurIntensityValue) {
        blurIntensity.addEventListener('input', function() {
            const value = parseInt(this.value);
            blurIntensityValue.textContent = value;
            window.blurFeature.intensity = value;
            
            // Update all existing regions
            window.blurFeature.regions.forEach(region => {
                region.intensity = value;
            });
            
            if (window.updateBlurIntensity) {
                window.updateBlurIntensity(value);
            }
            if (window.simpleBlur && window.simpleBlur.updateIntensity) {
                window.simpleBlur.updateIntensity(value);
            }
            
            console.log('🔧 Blur intensity set to:', value);
        });
    }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeBlurFeature, 4000); // Wait 4 seconds for all scripts to load
});

console.log('🔧 Blur feature integration helper loaded');