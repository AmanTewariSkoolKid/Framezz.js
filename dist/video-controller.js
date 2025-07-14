/*
  VIDEO-CONTROLLER.JS - THE SOLE PLAYBACK CONTROLLER
  This is now the ONLY system that handles video playback
*/

"use strict";

class VideoController {
  constructor() {
    // Video state
    this.isPlaying = false;
    this.currentFrame = 0;
    this.totalFrames = 0;
    this.frameRate = 30;
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
    
    // Safety flags to prevent initialization conflicts
    this.isInitializing = false;
    this.initializationAttempts = 0;
    this.maxInitializationAttempts = 5;
    
    this.initialize();
  }
  
  /*
    INITIALIZATION - THE SOLE CONTROLLER
    This is now the ONLY system that handles video playback
  */
  initialize() {
    // Prevent multiple initialization attempts
    if (this.isInitializing || this.initializationAttempts >= this.maxInitializationAttempts) {
      console.log("VideoController: Skipping initialization - already in progress or max attempts reached");
      return;
    }
    
    this.isInitializing = true;
    this.initializationAttempts++;
    
    try {
      console.log('VideoController: Initializing THE SOLE playback controller...');
      
      // Setup buttons with error checking
      this.setupButtons();
      
      // Setup timeline slider
      this.setupTimelineSlider();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      this.isInitializing = false;
      console.log('VideoController: Initialization complete - This is now THE ONLY playback handler');
    } catch (error) {
      console.error('VideoController: Error during initialization:', error);
      this.isInitializing = false;
    }
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
  
  /*
    FRAME NAVIGATION - DEFENSIVE LOGIC FOR FRAME EXTRACTION
  */
  seekToFrame(frameNumber) {
    // Clamp to valid range
    frameNumber = Math.max(0, Math.min(this.totalFrames - 1, frameNumber));

    if (frameNumber === this.currentFrame) return;

    this.currentFrame = frameNumber;

    try {
      // Update the actual video frame using the existing player system
      if (typeof window.player !== 'undefined' && window.player.goToFrame) {
        window.player.goToFrame(frameNumber);
      } else if (typeof goToFrame === 'function') {
        goToFrame(frameNumber);
      } else if (typeof setCurrentFrame === 'function') {
        setCurrentFrame(frameNumber);
      } else {
        console.warn('No valid frame update method found');
      }

      this.updateDisplay();
    } catch (error) {
      console.error('Error during frame navigation:', error);
    }
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
    if (!totalFrames || totalFrames <= 0) {
      console.warn('Invalid frame count, skipping video controller initialization');
      return;
    }

    this.totalFrames = totalFrames;
    this.frameRate = frameRate;
    this.currentFrame = 0;

    console.log('Video controller initialized with', totalFrames, 'frames at', frameRate, 'fps');

    try {
      // Enable all controls
      const buttons = ['skipToStart', 'back10Frames', 'back1Frame', 'playPauseBtn', 'forward1Frame', 'forward10Frames', 'skipToEnd'];
      buttons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          btn.disabled = false;
        }
      });
    } catch (error) {
      console.error('Error during video initialization:', error);
    }
  }
  
  /*
    KEYBOARD SHORTCUTS
    Define and manage keyboard shortcuts for playback control
  */
  setupKeyboardShortcuts() {
    // Example: Toggle play/pause with spacebar
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayPause();
      }
    });
  }
  
  /*
    UPDATE DISPLAY
    Update the current frame and time displays
  */
  updateDisplay() {
    if (this.currentFrameDisplay) {
      this.currentFrameDisplay.innerText = `Frame: ${this.currentFrame + 1} / ${this.totalFrames}`;
    }
    if (this.timeDisplay) {
      const currentTime = (this.currentFrame / this.frameRate) || 0;
      this.timeDisplay.innerText = `Time: ${currentTime.toFixed(2)} s`;
    }
  }
  
  /*
    SETUP BUTTONS
    Initialize button states and actions
  */
  setupButtons() {
    // Disable all buttons initially
    const buttons = ['skipToStart', 'back10Frames', 'back1Frame', 'playPauseBtn', 'forward1Frame', 'forward10Frames', 'skipToEnd'];
    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
      }
    });
    
    // Enable play/pause button immediately
    if (this.playPauseBtn) {
      this.playPauseBtn.disabled = false;
      this.playPauseBtn.style.opacity = '1.0';
    }
  }
}

/*
  GLOBAL VIDEO CONTROLLER INSTANCE
  Ensure only one instance exists and is used across the application
*/
if (typeof window.videoController === 'undefined') {
  window.videoController = new VideoController();
} else {
  console.warn('VideoController instance already exists:', window.videoController);
}
