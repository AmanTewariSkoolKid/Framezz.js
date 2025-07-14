/*
  VIDEO-CONTROLLER.JS - ENHANCED VIDEO PLAYBACK CONTROLS
  
  This file provides professional video player controls with frame-by-frame navigation,
  timeline scrubbing, and playback speed control. Think of it like creating a mini
  video editing interface similar to YouTube or professional video software.
  
  Features:
  - Frame-by-frame navigation (forward/backward)
  - Jump controls (skip to start/end, multi-frame steps)
  - Timeline slider with frame display
  - Playback speed control
  - Loop functionality
  - Keyboard shortcuts
*/

"use strict";

/*
  VIDEO CONTROLLER CLASS
  Manages all video playback functionality
*/
class VideoController {
  constructor() {
    // Video state
    this.isPlaying = false;
    this.currentFrame = 0;
    this.totalFrames = 0;
    this.frameRate = 30; // Default frame rate
    this.playbackSpeed = 1.0;
    this.isLooping = false;
    this.playbackInterval = null;
    
    // DOM elements
    this.slider = null;
    this.currentFrameDisplay = document.getElementById('currentFrameDisplay');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.speedInput = document.getElementById('speed');
    this.loopCheckbox = document.getElementById('loopPlayback');
    this.frameStepSelect = document.getElementById('frameStep');
    
    // Initialize the controller
    this.initialize();
  }
  
  /*
    INITIALIZATION
    Set up all event listeners and UI components
  */
  initialize() {
    this.setupEventListeners();
    this.setupSlider();
    this.updateDisplay();
  }
  
  /*
    SETUP EVENT LISTENERS
    Attach functions to button clicks and keyboard events
  */
  setupEventListeners() {
    // Navigation buttons
    const skipToStart = document.getElementById('skipToStart');
    const back10Frames = document.getElementById('back10Frames');
    const back1Frame = document.getElementById('back1Frame');
    const forward1Frame = document.getElementById('forward1Frame');
    const forward10Frames = document.getElementById('forward10Frames');
    const skipToEnd = document.getElementById('skipToEnd');
    
    if (skipToStart) skipToStart.addEventListener('click', () => this.skipToStart());
    if (back10Frames) back10Frames.addEventListener('click', () => this.stepFrames(-this.getStepSize()));
    if (back1Frame) back1Frame.addEventListener('click', () => this.stepFrames(-1));
    if (this.playPauseBtn) this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    if (forward1Frame) forward1Frame.addEventListener('click', () => this.stepFrames(1));
    if (forward10Frames) forward10Frames.addEventListener('click', () => this.stepFrames(this.getStepSize()));
    if (skipToEnd) skipToEnd.addEventListener('click', () => this.skipToEnd());
    
    // Settings controls
    if (this.speedInput) this.speedInput.addEventListener('change', () => this.updatePlaybackSpeed());
    if (this.loopCheckbox) this.loopCheckbox.addEventListener('change', () => this.updateLoopSetting());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Integrate with existing controls if they exist
    const oldPlayBtn = document.getElementById('play');
    const oldPauseBtn = document.getElementById('pause');
    if (oldPlayBtn) oldPlayBtn.addEventListener('click', () => this.play());
    if (oldPauseBtn) oldPauseBtn.addEventListener('click', () => this.pause());
  }
  
  /*
    SETUP TIMELINE SLIDER
    Create an interactive timeline that users can click and drag
  */
  setupSlider() {
    const sliderContainer = document.getElementById('slider');
    if (!sliderContainer) return;
    
    // Initialize jQuery UI slider if available
    if (typeof $ !== 'undefined' && $.ui) {
      $(sliderContainer).slider({
        min: 0,
        max: 100,
        value: 0,
        slide: (event, ui) => this.seekToPercent(ui.value),
        change: (event, ui) => this.seekToPercent(ui.value)
      });
      this.slider = $(sliderContainer);
    } else {
      // Fallback to custom slider
      this.setupCustomSlider(sliderContainer);
    }
  }
  
  /*
    CUSTOM SLIDER IMPLEMENTATION
    Fallback if jQuery UI is not available
  */
  setupCustomSlider(container) {
    container.innerHTML = '<div id="sliderThumb" style="width: 20px; height: 20px; background: #4CAF50; border-radius: 50%; position: absolute; top: 0; left: 0; cursor: pointer;"></div>';
    
    const thumb = document.getElementById('sliderThumb');
    let isDragging = false;
    
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.updateSliderFromMouse(e, container);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        this.updateSliderFromMouse(e, container);
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
  
  /*
    UPDATE SLIDER FROM MOUSE
    Handle mouse interaction with custom slider
  */
  updateSliderFromMouse(event, container) {
    const rect = container.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    this.seekToPercent(percent);
  }
  
  /*
    PLAYBACK CONTROLS
  */
  play() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    if (this.playPauseBtn) {
      this.playPauseBtn.innerHTML = '⏸️ Pause';
      this.playPauseBtn.style.background = '#f44336';
    }
    
    // Show old pause button and hide play button if they exist
    const oldPlayBtn = document.getElementById('play');
    const oldPauseBtn = document.getElementById('pause');
    if (oldPlayBtn) oldPlayBtn.style.display = 'none';
    if (oldPauseBtn) oldPauseBtn.style.display = 'inline';
    
    // Start playback interval
    const frameInterval = (1000 / this.frameRate) / this.playbackSpeed;
    this.playbackInterval = setInterval(() => {
      this.stepFrames(1);
      
      // Check if we've reached the end
      if (this.currentFrame >= this.totalFrames - 1) {
        if (this.isLooping) {
          this.skipToStart();
        } else {
          this.pause();
        }
      }
    }, frameInterval);
  }
  
  pause() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.playPauseBtn) {
      this.playPauseBtn.innerHTML = '▶️ Play';
      this.playPauseBtn.style.background = '#4CAF50';
    }
    
    // Show old play button and hide pause button if they exist
    const oldPlayBtn = document.getElementById('play');
    const oldPauseBtn = document.getElementById('pause');
    if (oldPlayBtn) oldPlayBtn.style.display = 'inline';
    if (oldPauseBtn) oldPauseBtn.style.display = 'none';
    
    // Clear playback interval
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }
  
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  /*
    FRAME NAVIGATION
  */
  stepFrames(steps) {
    this.seekToFrame(this.currentFrame + steps);
  }
  
  seekToFrame(frameNumber) {
    // Clamp to valid range
    frameNumber = Math.max(0, Math.min(this.totalFrames - 1, frameNumber));
    
    if (frameNumber === this.currentFrame) return;
    
    this.currentFrame = frameNumber;
    
    // Update the actual video frame using the existing player system
    if (typeof window.player !== 'undefined' && window.player.goToFrame) {
      window.player.goToFrame(frameNumber);
    } else if (typeof goToFrame === 'function') {
      goToFrame(frameNumber);
    } else if (typeof setCurrentFrame === 'function') {
      setCurrentFrame(frameNumber);
    }
    
    this.updateDisplay();
  }
  
  seekToPercent(percent) {
    const frameNumber = Math.round((percent / 100) * (this.totalFrames - 1));
    this.seekToFrame(frameNumber);
  }
  
  skipToStart() {
    this.seekToFrame(0);
  }
  
  skipToEnd() {
    this.seekToFrame(this.totalFrames - 1);
  }
  
  /*
    SETTINGS
  */
  updatePlaybackSpeed() {
    this.playbackSpeed = parseFloat(this.speedInput.value) || 1.0;
    
    // Update the old speed input too
    const oldSpeedInput = document.querySelector('input[id="speed"][size="4"]');
    if (oldSpeedInput) {
      oldSpeedInput.value = this.playbackSpeed.toFixed(2);
    }
    
    // Restart playback with new speed if currently playing
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }
  
  updateLoopSetting() {
    this.isLooping = this.loopCheckbox ? this.loopCheckbox.checked : false;
  }
  
  getStepSize() {
    return this.frameStepSelect ? parseInt(this.frameStepSelect.value) || 10 : 10;
  }
  
  /*
    VIDEO INITIALIZATION
    Call this when a video is loaded
  */
  initializeVideo(totalFrames, frameRate = 30) {
    this.totalFrames = totalFrames;
    this.frameRate = frameRate;
    this.currentFrame = 0;
    
    console.log('Video controller initialized with', totalFrames, 'frames at', frameRate, 'fps');
    
    // Enable all controls
    const buttons = ['skipToStart', 'back10Frames', 'back1Frame', 'playPauseBtn', 'forward1Frame', 'forward10Frames', 'skipToEnd'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = false;
    });
    
    // Update slider range
    if (this.slider && this.slider.slider) {
      this.slider.slider('option', 'max', totalFrames - 1);
    }
    
    this.updateDisplay();
  }
  
  /*
    DISPLAY UPDATES
  */
  updateDisplay() {
    // Update frame counter
    if (this.currentFrameDisplay) {
      this.currentFrameDisplay.textContent = `Frame: ${this.currentFrame + 1} / ${this.totalFrames}`;
    }
    
    // Update time display
    if (this.timeDisplay) {
      const currentTime = this.currentFrame / this.frameRate;
      const totalTime = this.totalFrames / this.frameRate;
      this.timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(totalTime)}`;
    }
    
    // Update slider position
    if (this.totalFrames > 0) {
      const percent = (this.currentFrame / (this.totalFrames - 1)) * 100;
      
      if (this.slider && this.slider.slider) {
        this.slider.slider('value', percent);
      } else {
        // Update custom slider
        const thumb = document.getElementById('sliderThumb');
        if (thumb) {
          thumb.style.left = `calc(${percent}% - 10px)`;
        }
      }
    }
  }
  
  /*
    UTILITY FUNCTIONS
  */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toFixed(2).padStart(5, '0')}`;
  }
  
  /*
    KEYBOARD SHORTCUTS
  */
  handleKeyboard(event) {
    // Don't handle keyboard if user is typing in an input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.stepFrames(event.shiftKey ? -this.getStepSize() : -1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.stepFrames(event.shiftKey ? this.getStepSize() : 1);
        break;
      case 'Home':
        event.preventDefault();
        this.skipToStart();
        break;
      case 'End':
        event.preventDefault();
        this.skipToEnd();
        break;
    }
  }
  
  /*
    EXTERNAL INTEGRATION
    Methods to be called from other parts of the application
  */
  notifyFrameChange(frameNumber) {
    if (frameNumber !== this.currentFrame) {
      this.currentFrame = frameNumber;
      this.updateDisplay();
    }
  }
  
  reset() {
    this.pause();
    this.currentFrame = 0;
    this.totalFrames = 0;
    this.updateDisplay();
    
    // Disable all controls
    const buttons = ['skipToStart', 'back10Frames', 'back1Frame', 'playPauseBtn', 'forward1Frame', 'forward10Frames', 'skipToEnd'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = true;
    });
  }
}

/*
  GLOBAL INITIALIZATION
  Create the global video controller instance
*/
let videoController;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
  videoController = new VideoController();
  
  // Make it globally accessible
  window.videoController = videoController;
  
  console.log('Video controller loaded and ready');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoController;
}
