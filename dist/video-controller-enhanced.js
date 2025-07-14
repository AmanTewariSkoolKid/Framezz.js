/*
  VIDEO-CONTROLLER.JS - ENHANCED VIDEO PLAYBACK CONTROLS
  
  This file provides professional video player controls with frame-by-frame navigation,
  timeline scrubbing, and playback speed control. 
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
    this.currentFrameDisplay = document.getElementById('currentFrameDisplay');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.playPauseBtn = document.getElementById('playPauseBtn');
    this.speedInput = document.getElementById('speed');
    this.loopCheckbox = document.getElementById('loopPlayback');
    this.frameStepSelect = document.getElementById('frameStep');
    this.timelineSlider = document.getElementById('timelineSlider');
    
    // Initialize the controller
    this.initialize();
  }
  
  /*
    INITIALIZATION
    Set up all event listeners and UI components
  */
  initialize() {
    this.setupEventListeners();
    this.updateDisplay();
  }
  
  /*
    SETUP EVENT LISTENERS
    Attach functions to button clicks and keyboard events
  */
  setupEventListeners() {
    // Navigation buttons
    document.getElementById('skipToStart').addEventListener('click', () => this.skipToStart());
    document.getElementById('back10Frames').addEventListener('click', () => this.stepFrames(-this.getStepSize()));
    document.getElementById('back1Frame').addEventListener('click', () => this.stepFrames(-1));
    document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
    document.getElementById('forward1Frame').addEventListener('click', () => this.stepFrames(1));
    document.getElementById('forward10Frames').addEventListener('click', () => this.stepFrames(this.getStepSize()));
    document.getElementById('skipToEnd').addEventListener('click', () => this.skipToEnd());
    
    // Timeline slider
    if (this.timelineSlider) {
      this.timelineSlider.addEventListener('input', (e) => {
        const percent = parseFloat(e.target.value);
        this.seekToPercent(percent);
      });
    }
    
    // Settings controls
    if (this.speedInput) {
      this.speedInput.addEventListener('change', () => this.updatePlaybackSpeed());
    }
    if (this.loopCheckbox) {
      this.loopCheckbox.addEventListener('change', () => this.updateLoopSetting());
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    
    // Integrate with existing controls if they exist
    const oldPlayBtn = document.getElementById('play');
    const oldPauseBtn = document.getElementById('pause');
    if (oldPlayBtn) oldPlayBtn.addEventListener('click', () => this.play());
    if (oldPauseBtn) oldPauseBtn.addEventListener('click', () => this.pause());
  }
  
  /*
    PLAYBACK CONTROLS
  */
  play() {
    if (this.isPlaying || this.totalFrames <= 0) return;
    
    this.isPlaying = true;
    this.updatePlayPauseButton();
    
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
    
    // Call existing play function if available
    if (typeof window.player !== 'undefined' && window.player.play) {
      window.player.play();
    }
  }
  
  pause() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.updatePlayPauseButton();
    
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
    
    // Call existing pause function if available
    if (typeof window.player !== 'undefined' && window.player.pause) {
      window.player.pause();
    }
  }
  
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  updatePlayPauseButton() {
    if (!this.playPauseBtn) return;
    
    if (this.isPlaying) {
      this.playPauseBtn.innerHTML = '⏸️ Pause';
      this.playPauseBtn.style.background = 'linear-gradient(145deg, #f44336, #d32f2f)';
    } else {
      this.playPauseBtn.innerHTML = '▶️ Play';
      this.playPauseBtn.style.background = 'linear-gradient(145deg, #4CAF50, #388E3C)';
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
    
    console.log(`Seeking to frame: ${frameNumber}`);
    
    // Try multiple methods to update the frame display
    if (typeof window.player !== 'undefined' && window.player.seek) {
      console.log('Using player.seek function');
      window.player.seek(frameNumber);
    } else if (typeof goToFrame === 'function') {
      console.log('Using goToFrame function');
      goToFrame(frameNumber);
    } else if (typeof setCurrentFrame === 'function') {
      console.log('Using setCurrentFrame function');
      setCurrentFrame(frameNumber);
    } else if (typeof window.slider !== 'undefined' && window.slider.slider) {
      console.log('Using jQuery slider');
      window.slider.slider('value', frameNumber);
    } else if (typeof updateFrame === 'function') {
      console.log('Using updateFrame function');
      updateFrame(frameNumber);
    } else {
      console.log('No frame update function found, trying direct methods');
      
      // Try to find and update the existing slider
      const existingSlider = $('#slider');
      if (existingSlider.length && existingSlider.slider) {
        existingSlider.slider('value', frameNumber);
      }
      
      // Try to trigger frame update via global variables
      if (typeof window.currentFrame !== 'undefined') {
        window.currentFrame = frameNumber;
        
        // Trigger any update functions
        if (typeof window.updateDisplay === 'function') {
          window.updateDisplay();
        }
        if (typeof window.drawFrame === 'function') {
          window.drawFrame(frameNumber);
        }
      }
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
    return parseInt(this.frameStepSelect ? this.frameStepSelect.value : 10) || 10;
  }
  
  /*
    VIDEO INITIALIZATION
    Call this when a video is loaded
  */
  initializeVideo(totalFrames, frameRate = 30) {
    console.log(`Initializing video controller: ${totalFrames} frames at ${frameRate}fps`);
    
    this.totalFrames = totalFrames;
    this.frameRate = frameRate;
    this.currentFrame = 0;
    
    // Enable all controls
    const buttons = ['skipToStart', 'back10Frames', 'back1Frame', 'playPauseBtn', 'forward1Frame', 'forward10Frames', 'skipToEnd'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = false;
    });
    
    // Update timeline slider range
    if (this.timelineSlider) {
      this.timelineSlider.max = 100;
      this.timelineSlider.value = 0;
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
    
    // Update timeline slider position
    if (this.timelineSlider && this.totalFrames > 0) {
      const percent = (this.currentFrame / (this.totalFrames - 1)) * 100;
      this.timelineSlider.value = percent;
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
  
  console.log('Video controller initialized');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VideoController;
}
