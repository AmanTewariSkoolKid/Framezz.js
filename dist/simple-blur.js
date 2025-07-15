/*
  SIMPLE BLUR FEATURE
  Clean, minimal implementation for the video annotation tool
  
  This is an optional enhancement file that can be loaded for additional
  blur functionality. The main blur feature works directly in the HTML.
*/

class SimpleBlur {
    constructor() {
        this.enabled = false;
        this.regions = [];
        this.canvas = null;
        this.overlay = null;
        this.ctx = null;
        this.overlayCtx = null;
    }
    
    /*
      INITIALIZE BLUR SYSTEM
      Sets up the blur overlay and canvas integration
    */
    init() {
        console.log('🔧 Initializing simple blur system...');
        
        // Get main canvas
        this.canvas = document.querySelector('#c') || document.querySelector('canvas');
        if (!this.canvas) {
            console.warn('⚠️ Main canvas not found for blur system');
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Create overlay canvas
        this.createOverlay();
        
        // Set up monitoring
        this.setupMonitoring();
        
        console.log('✅ Simple blur system initialized');
        return true;
    }
    
    /*
      CREATE OVERLAY CANVAS
      Creates the blur overlay canvas that sits above the main canvas
    */
    createOverlay() {
        this.overlay = document.createElement('canvas');
        this.overlay.id = 'simpleBlurOverlay';
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            z-index: 5;
            pointer-events: none;
            opacity: 1;
            transition: opacity 0.3s ease;
        `;
        
        this.overlayCtx = this.overlay.getContext('2d');
        
        // Insert overlay into the doodle container
        const container = document.querySelector('#doodle');
        if (container) {
            // Ensure container has relative positioning
            const containerStyle = getComputedStyle(container);
            if (containerStyle.position === 'static') {
                container.style.position = 'relative';
            }
            
            container.appendChild(this.overlay);
            console.log('✅ Blur overlay canvas created and positioned');
        } else {
            console.warn('⚠️ Doodle container not found for blur overlay');
        }
    }
    
    /*
      UPDATE OVERLAY SIZE
      Ensures overlay matches the main canvas size
    */
    updateOverlaySize() {
        if (!this.overlay || !this.canvas) return;
        
        // Match canvas dimensions
        this.overlay.width = this.canvas.width;
        this.overlay.height = this.canvas.height;
        
        // Match display size
        const rect = this.canvas.getBoundingClientRect();
        this.overlay.style.width = rect.width + 'px';
        this.overlay.style.height = rect.height + 'px';
        
        // Match position
        this.overlay.style.top = this.canvas.offsetTop + 'px';
        this.overlay.style.left = this.canvas.offsetLeft + 'px';
    }
    
    /*
      SETUP MONITORING
      Monitors for canvas changes and updates
    */
    setupMonitoring() {
        // Monitor canvas size changes
        const resizeObserver = new ResizeObserver(() => {
            this.updateOverlaySize();
            this.render();
        });
        
        if (this.canvas) {
            resizeObserver.observe(this.canvas);
        }
        
        // Monitor for video frame updates
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.addEventListener('timeupdate', () => {
                this.render();
            });
        }
        
        // Periodic updates for smooth rendering
        setInterval(() => {
            if (this.regions.length > 0) {
                this.render();
            }
        }, 100);
    }
    
    /*
      ADD BLUR REGION
      Adds a new region to be blurred
    */
    addRegion(x, y, width, height, intensity = 8) {
        const region = {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.max(1, width),
            height: Math.max(1, height),
            intensity: Math.max(1, Math.min(20, intensity)),
            id: Date.now() + Math.random()
        };
        
        this.regions.push(region);
        this.render();
        
        console.log('✅ Blur region added:', region);
        return region.id;
    }
    
    /*
      REMOVE REGION
      Removes a specific blur region by ID
    */
    removeRegion(id) {
        const index = this.regions.findIndex(r => r.id === id);
        if (index !== -1) {
            this.regions.splice(index, 1);
            this.render();
            console.log('✅ Blur region removed:', id);
            return true;
        }
        return false;
    }
    
    /*
      CLEAR ALL REGIONS
      Removes all blur regions
    */
    clearRegions() {
        this.regions = [];
        this.render();
        console.log('✅ All blur regions cleared');
    }
    
    /*
      UPDATE REGION INTENSITY
      Updates the intensity of all regions
    */
    updateIntensity(newIntensity) {
        const intensity = Math.max(1, Math.min(20, newIntensity));
        this.regions.forEach(region => {
            region.intensity = intensity;
        });
        this.render();
        console.log('✅ Blur intensity updated to:', intensity);
    }
    
    /*
      RENDER BLUR EFFECTS
      Applies blur to all regions on the overlay canvas
    */
    render() {
        if (!this.overlay || !this.canvas || !this.overlayCtx || !this.ctx) return;
        
        // Update overlay size
        this.updateOverlaySize();
        
        // Clear overlay
        this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        
        // Skip if no regions
        if (this.regions.length === 0) return;
        
        // Apply blur to each region
        this.regions.forEach(region => {
            this.renderRegion(region);
        });
    }
    
    /*
      RENDER SINGLE REGION
      Applies blur to a single region
    */
    renderRegion(region) {
        try {
            // Ensure region is within canvas bounds
            const clampedRegion = {
                x: Math.max(0, Math.min(region.x, this.canvas.width - 1)),
                y: Math.max(0, Math.min(region.y, this.canvas.height - 1)),
                width: Math.max(1, Math.min(region.width, this.canvas.width - region.x)),
                height: Math.max(1, Math.min(region.height, this.canvas.height - region.y))
            };
            
            // Extract image data from main canvas
            const imageData = this.ctx.getImageData(
                clampedRegion.x,
                clampedRegion.y,
                clampedRegion.width,
                clampedRegion.height
            );
            
            // Apply blur
            const blurredData = this.applyBlur(imageData, region.intensity);
            
            // Draw blurred region on overlay
            this.overlayCtx.putImageData(blurredData, clampedRegion.x, clampedRegion.y);
            
        } catch (error) {
            console.warn('⚠️ Error rendering blur region:', error);
        }
    }
    
    /*
      APPLY BLUR ALGORITHM
      Applies box blur to image data
    */
    applyBlur(imageData, intensity) {
        const { data, width, height } = imageData;
        const result = new Uint8ClampedArray(data);
        const radius = Math.floor(intensity / 2);
        
        // Horizontal blur pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                let r = 0, g = 0, b = 0, count = 0;
                
                // Sample surrounding pixels
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    if (nx >= 0 && nx < width) {
                        const nIndex = (y * width + nx) * 4;
                        r += data[nIndex];
                        g += data[nIndex + 1];
                        b += data[nIndex + 2];
                        count++;
                    }
                }
                
                // Set averaged color
                result[index] = r / count;
                result[index + 1] = g / count;
                result[index + 2] = b / count;
                result[index + 3] = data[index + 3]; // Preserve alpha
            }
        }
        
        // Vertical blur pass
        const finalResult = new Uint8ClampedArray(result);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                let r = 0, g = 0, b = 0, count = 0;
                
                // Sample surrounding pixels
                for (let dy = -radius; dy <= radius; dy++) {
                    const ny = y + dy;
                    if (ny >= 0 && ny < height) {
                        const nIndex = (ny * width + x) * 4;
                        r += result[nIndex];
                        g += result[nIndex + 1];
                        b += result[nIndex + 2];
                        count++;
                    }
                }
                
                // Set averaged color
                finalResult[index] = r / count;
                finalResult[index + 1] = g / count;
                finalResult[index + 2] = b / count;
                finalResult[index + 3] = result[index + 3]; // Preserve alpha
            }
        }
        
        return new ImageData(finalResult, width, height);
    }
    
    /*
      TOGGLE VISIBILITY
      Shows/hides the blur overlay
    */
    toggleVisibility() {
        if (!this.overlay) return;
        
        const isVisible = this.overlay.style.opacity !== '0';
        this.overlay.style.opacity = isVisible ? '0' : '1';
        
        console.log('👁️ Blur visibility:', isVisible ? 'hidden' : 'visible');
        return !isVisible;
    }
    
    /*
      GET REGIONS DATA
      Returns current blur regions for export
    */
    getRegionsData() {
        return {
            regions: this.regions,
            timestamp: Date.now(),
            canvasSize: {
                width: this.canvas ? this.canvas.width : 0,
                height: this.canvas ? this.canvas.height : 0
            }
        };
    }
    
    /*
      LOAD REGIONS DATA
      Loads blur regions from saved data
    */
    loadRegionsData(data) {
        if (data && Array.isArray(data.regions)) {
            this.regions = data.regions;
            this.render();
            console.log('✅ Blur regions loaded:', this.regions.length);
            return true;
        }
        return false;
    }
    
    /*
      CLEANUP
      Removes the blur overlay and cleans up resources
    */
    cleanup() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.overlayCtx = null;
        }
        
        this.regions = [];
        this.canvas = null;
        this.ctx = null;
        
        console.log('🧹 Simple blur system cleaned up');
    }
}

// Auto-initialize when page loads (optional)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!window.simpleBlur) {
            window.simpleBlur = new SimpleBlur();
            const initialized = window.simpleBlur.init();
            
            if (initialized) {
                console.log('✅ Simple blur system ready for use');
                
                // Make helper functions available globally
                window.addBlurRegion = (x, y, width, height, intensity) => {
                    return window.simpleBlur.addRegion(x, y, width, height, intensity);
                };
                
                window.clearBlurRegions = () => {
                    window.simpleBlur.clearRegions();
                };
                
                window.updateBlurIntensity = (intensity) => {
                    window.simpleBlur.updateIntensity(intensity);
                };
                
                window.toggleBlurVisibility = () => {
                    return window.simpleBlur.toggleVisibility();
                };
            }
        }
    }, 2000); // Wait for main app to load
});

console.log('🔧 Simple blur feature module loaded');
