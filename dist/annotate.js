/*
  ANNOTATE.JS - THE VIDEO ANNOTATION USER INTERFACE
  
  This file is like the control panel of our video annotation tool. Think of it like the
  dashboard of a car - it has all the buttons, dials, and displays that let you control
  the engine (framez.js) and see what's happening.
  
  What this file does:
  1. Sets up all the user interface controls (play/pause buttons, sliders, etc.)
  2. Handles user interactions (clicking, dragging, typing)
  3. Coordinates between the user interface and the video processing engine
  4. Manages the annotation workflow (drawing boxes, tracking objects, exporting results)
  
  Think of it like being the director of a movie production:
  - The framez.js is like the camera crew (handles the technical video work)
  - This file is like the director (coordinates everything and responds to what happens)
  - The HTML is like the movie set (provides the physical space where everything happens)
*/

"use strict"; // Tell JavaScript to be extra careful about catching programming mistakes

      /*
        CONFIGURATION OBJECT - THE SETTINGS CONTROL PANEL
        
        This object is like the settings menu in a video game or app. It contains all the
        important numbers and preferences that control how the video annotation tool works.
        
        Think of it like the control settings on a camera:
        - ISO setting controls light sensitivity
        - Shutter speed controls motion blur
        - These settings control video processing and quality
        
        Why have a config object?
        Instead of scattering magic numbers throughout the code, we put them all in one
        place. This makes it easy to adjust settings without hunting through hundreds of
        lines of code. It's like having all your TV remote's settings in one menu.
      */
      let config = {
        // Should be higher than real FPS to not skip real frames
        // Hardcoded due to JS limitations
        fps: 30, // Frames per second - how many pictures per second we expect from the video
        
        // Low rate decreases the chance of losing frames with poor browser performances
        playbackRate: 0.4, // Play video at 40% normal speed during frame extraction (slower = more reliable)

        // Format of the extracted frames
        imageMimeType: 'image/jpeg', // Save frames as JPEG files (good compression, smaller files)
        imageExtension: '.jpg',      // File extension for saved frames

        // Name of the extracted frames zip archive
        framesZipFilename: 'extracted-frames.zip' // Default name for the downloaded ZIP file
      };

      /*
        DOM ELEMENT REFERENCES - CONNECTING TO THE USER INTERFACE
        
        These variables are like getting handles on all the controls in your car dashboard.
        Before you can use the steering wheel, you need to grab it. Before you can use
        the radio, you need to know where the volume knob is.
        
        document.querySelector() is like saying "find me the element with this ID"
        It's like looking for a specific button on a control panel by reading its label.
        
        Think of it like this: The HTML created all these buttons and input fields,
        but they're just sitting there. These lines create "remote controls" that let
        our JavaScript code actually operate those buttons and fields.
        
        Why store these in variables?
        1. Performance: Looking up elements is slow, so we do it once and remember the result
        2. Convenience: Instead of typing document.querySelector('#play') every time, we just use playButton
        3. Error prevention: If we mistype an ID, we'll find out immediately when the page loads
      */
      let doodle = document.querySelector('#doodle');                         // The video display area where annotations are drawn
      let canvas = document.querySelector('#canvas');                         // The drawing surface overlaid on the video
      let ctx = canvas.getContext('2d');                                     // The "paintbrush" for drawing on the canvas
      let videoFile = document.querySelector('#videoFile');                   // File input for selecting video files
      let zipFile = document.querySelector('#zipFile');                       // File input for selecting ZIP archives
      let xmlFile = document.querySelector('#xmlFile');                       // File input for selecting XML annotation files
      let videoDimensionsElement = document.querySelector('#videoDimensions'); // Text area to show video size info
      let extractionProgressElement = document.querySelector('#extractionProgress'); // Text area to show extraction progress
      let downloadFramesButton = document.querySelector('#downloadFrames');   // Button to download extracted frames
      let playButton = document.querySelector('#play');                       // Play button (like on a video player)
      let pauseButton = document.querySelector('#pause');                     // Pause button (like on a video player)
      let speedInput = document.querySelector('#speed');                      // Input field for playback speed
      let sliderElement = document.querySelector('#slider');                  // Slider for scrubbing through video timeline
      let generateXmlButton = document.querySelector('#generateXml');         // Button to export annotations as XML
      let exportVideoButton = document.querySelector('#exportVideo');         // Button to export annotated video
      let exportAnnotatedZipButton = document.querySelector('#exportAnnotatedZip'); // Button to export annotated frames as ZIP
      let exportProgressDiv = document.querySelector('#exportProgress');      // Container for export progress display
      let exportProgressBar = document.querySelector('#exportProgressBar');   // Progress bar for export operations
      let exportProgressText = document.querySelector('#exportProgressText'); // Progress text for export operations

      /*
        CORE SYSTEM COMPONENTS - THE ENGINE AND TRACKER
        
        These are the two main "brains" of our application:
        
        1. framesManager: Think of this like a photo album manager. It knows how to:
           - Store all the individual frames from our video
           - Retrieve any specific frame when we need it
           - Keep track of how many frames we have total
        
        2. annotatedObjectsTracker: Think of this like a smart assistant who remembers:
           - Where each object (car, person, etc.) is in each frame
           - How objects move between frames using optical flow
           - Which annotations were drawn by humans vs. predicted by computer
        
        These work together like a librarian (framesManager) and a detective (annotatedObjectsTracker):
        - The librarian manages the photo collection
        - The detective analyzes the photos and tracks what's happening in them
      */
      let framesManager = new FramesManager();                               // Manages the collection of video frames
      let annotatedObjectsTracker = new AnnotatedObjectsTracker(framesManager); // Tracks objects across frames

      /*
        SLIDER CONTROL OBJECT - THE VIDEO TIMELINE SCRUBBER
        
        This object manages the horizontal slider that lets users scrub through the video
        timeline. Think of it like the progress bar on YouTube where you can:
        - Click and drag to jump to any point in the video
        - See where you currently are in the video
        - Enable/disable the slider when appropriate
        
        It's built using jQuery UI, which provides the fancy draggable slider functionality.
        We wrap it in our own object to make it easier to use and customize.
        
        The pattern here is called "object literal" - we create an object with several
        functions (methods) that all work together to manage one aspect of the UI.
      */
      let slider = {
        /*
          INITIALIZATION - SETTING UP THE SLIDER
          
          This function configures the slider with the video's frame range and sets up
          what happens when the user moves the slider.
          
          Parameters:
          - min: The first frame number (usually 0)
          - max: The last frame number (total frames - 1)
          - onChange: Function to call when user moves the slider
          
          Think of this like calibrating a speedometer in a car - you need to tell it
          what the minimum and maximum speeds are, and what to do when the needle moves.
        */
        init: function(min, max, onChange) {
          $(sliderElement).slider('option', 'min', min);     // Set the leftmost position value
          $(sliderElement).slider('option', 'max', max);     // Set the rightmost position value
          $(sliderElement).on('slidestop', (e, ui) => {      // When user stops dragging the slider
            onChange(ui.value);                              // Call the provided function with the new frame number
          });
          $(sliderElement).slider('enable');                 // Make the slider interactive
        },
        
        /*
          POSITION SETTER - MOVING THE SLIDER PROGRAMMATICALLY
          
          This function moves the slider to show the current frame position.
          It's like updating the position indicator on a video player to show
          where you are in the video.
          
          This is called "programmatically" because our code is moving the slider,
          not the user. When the video auto-plays, we need to update the slider
          position to match.
        */
        setPosition: function(frameNumber) {
          $(sliderElement).slider('option', 'value', frameNumber); // Move slider handle to this frame position
        },
        
        /*
          RESET - DISABLING THE SLIDER
          
          This function disables the slider and resets it to a default state.
          We do this when no video is loaded, or when we're in the middle of
          loading a new video.
          
          It's like graying out controls that can't be used right now.
        */
        reset: function() {
          $(sliderElement).slider({disabled: true}); // Make the slider unresponsive and visually disabled
        }
      };
      slider.reset(); // Start with the slider disabled (no video loaded yet)

      /*
        VIDEO PLAYER OBJECT - THE HEART OF VIDEO PLAYBACK CONTROL
        
        This object is like the engine of a video player (think YouTube or Netflix player).
        It manages all aspects of video playback:
        - Playing and pausing the video
        - Keeping track of which frame is currently displayed
        - Drawing frames with their annotations
        - Managing the timing of automatic playback
        
        Unlike a regular video player that plays actual video files, this player works
        with individual frame images and simulates video playback by showing them in sequence.
        
        Think of it like a digital flip-book player:
        - Each page is a frame
        - The player flips through pages at a controlled speed
        - It can start, stop, or jump to any specific page
        - It overlays drawings (annotations) on each page as it shows them
      */
      let player = {
        /*
          STATE VARIABLES - THE PLAYER'S MEMORY
          
          These variables keep track of the player's current state, like a car's dashboard
          that shows speed, fuel level, etc.
        */
        currentFrame: 0,      // Which frame are we currently showing? (like "page 42 of 100")
        isPlaying: false,     // Is the video currently playing? (like "engine running" indicator)
        isReady: false,       // Is the player ready to play? (like "engine warmed up" indicator)
        timeout: null,        // Timer for automatic frame advancement (like cruise control timer)

        /*
          INITIALIZATION - SETTING UP A FRESH PLAYER
          
          This function resets the player to its starting state, like turning off a car
          and resetting all the dashboard indicators to their default positions.
          
          Called when loading a new video or when the application starts up.
        */
        initialize: function() {
          this.currentFrame = 0;     // Start at the beginning (frame 0)
          this.isPlaying = false;    // Not playing yet
          this.isReady = false;      // Not ready until frames are loaded

          // Reset the UI buttons to their initial state
          playButton.disabled = true;        // Gray out play button (can't play until ready)
          playButton.style.display = 'block'; // Show the play button
          pauseButton.disabled = true;       // Gray out pause button
          pauseButton.style.display = 'none'; // Hide the pause button (only show one at a time)
        },

        /*
          READY STATE - ENABLING THE PLAYER
          
          This function is called when everything is loaded and the player is ready to work.
          It's like when your car has warmed up and all the dashboard lights indicate "ready to drive."
        */
        ready: function() {
          this.isReady = true;       // Mark the player as ready for use

          playButton.disabled = false; // Enable the play button (user can now click it)
          
          // Initialize the video controller with frame information
          const totalFrames = framesManager.frames.totalFrames();
          if (totalFrames > 0) {
            initializeVideoController(totalFrames, config.fps);
          }
        },

        /*
          SEEK FUNCTION - JUMPING TO A SPECIFIC FRAME
          
          This is like using the "skip to chapter" function on a DVD player.
          The user can jump directly to any frame in the video without having to
          play through all the frames in between.
          
          Think of it like flipping directly to page 50 in a book instead of
          turning every page from 1 to 50.
          
          This function is called when:
          - User drags the timeline slider
          - User presses left/right arrow keys
          - User clicks on a specific frame number
        */
        seek: function(frameNumber) {
          if (!this.isReady) {       // Safety check: don't do anything if player isn't ready
            return;
          }

          this.pause();              // Stop any automatic playback first

          // Bounds checking: make sure the requested frame actually exists
          if (frameNumber >= 0 && frameNumber < framesManager.frames.totalFrames()) {
            this.drawFrame(frameNumber); // Display the requested frame
            this.currentFrame = frameNumber; // Update our position tracking
            
            // Update annotation manager with current frame
            if (window.annotationManager) {
              window.annotationManager.setCurrentFrame(frameNumber);
            }
            
            // Notify video controller of frame change
            notifyVideoControllerFrameChange(frameNumber);
          }
        },

        /*
          PLAY FUNCTION - STARTING AUTOMATIC PLAYBACK
          
          This starts the video playing automatically, like pressing the play button
          on any video player. It sets up a timer that will advance to the next frame
          at regular intervals, creating the illusion of smooth video playback.
          
          Think of it like setting up a metronome that will turn the pages of a
          flip-book at a steady rhythm.
        */
        play: function() {
          if (!this.isReady) {       // Safety check: don't do anything if player isn't ready
            return;
          }

          this.isPlaying = true;     // Mark that we're now in playing mode

          // Update the UI buttons: hide play button, show pause button
          playButton.disabled = true;        // Gray out play button
          playButton.style.display = 'none'; // Hide play button
          pauseButton.disabled = false;      // Enable pause button
          pauseButton.style.display = 'block'; // Show pause button

          this.nextFrame();          // Start the automatic frame advancement
        },

        /*
          PAUSE FUNCTION - STOPPING AUTOMATIC PLAYBACK
          
          This stops the automatic playback, like pressing the pause button on any
          video player. It cancels any pending frame advancement and updates the UI.
          
          Think of it like stopping the metronome that was turning flip-book pages.
        */
        pause: function() {
          if (!this.isReady) {       // Safety check: don't do anything if player isn't ready
            return;
          }

          this.isPlaying = false;    // Mark that we're no longer in playing mode
          
          // Cancel any pending frame advancement
          if (this.timeout != null) {
            clearTimeout(this.timeout); // Stop the timer
            this.timeout = null;         // Clear the timer reference
          }

          // Update the UI buttons: hide pause button, show play button
          pauseButton.disabled = true;       // Gray out pause button
          pauseButton.style.display = 'none'; // Hide pause button
          playButton.disabled = false;       // Enable play button
          playButton.style.display = 'block'; // Show play button
        },

        /*
          TOGGLE FUNCTION - PLAY/PAUSE SWITCHER
          
          This function switches between play and pause states, like a single
          play/pause button that changes behavior based on current state.
          
          It's called when the user presses the spacebar (common video player shortcut).
        */
        toogle: function() {         // Note: "toogle" is a typo in original code, should be "toggle"
          if (!this.isPlaying) {
            this.play();             // If paused, start playing
          } else {
            this.pause();            // If playing, pause
          }
        },

        /*
          NEXT FRAME FUNCTION - THE AUTOMATIC FRAME ADVANCEMENT ENGINE
          
          This is the "heartbeat" of video playback. It's called repeatedly while the video
          is playing to advance to the next frame. Think of it like the mechanism in a
          film projector that advances the film one frame at a time.
          
          The function:
          1. Checks if we should keep playing
          2. Checks if we've reached the end
          3. Displays the current frame
          4. Sets up a timer to call itself again for the next frame
          
          This creates a self-repeating cycle that simulates smooth video playback.
        */
        nextFrame: function() {
          if (!this.isPlaying) {     // If playback was stopped, don't continue
            return;
          }

          // Check if we've reached the end of the video
          if (this.currentFrame >= framesManager.frames.totalFrames()) {
            this.done();             // End of video reached, clean up and stop
            return;
          }

          // Display the current frame, then set up the next advancement
          this.drawFrame(this.currentFrame).then(() => {
            this.currentFrame++;     // Move to the next frame
            
            // Notify video controller of frame change during playback
            notifyVideoControllerFrameChange(this.currentFrame);
            
            // Calculate delay until next frame based on FPS and speed settings
            // Formula: 1000ms ÷ (fps × speed) = delay in milliseconds
            // Example: 1000 ÷ (30 × 1.0) = 33.33ms delay (30 FPS)
            this.timeout = setTimeout(() => this.nextFrame(), 1000 / (config.fps * parseFloat(speedInput.value)));
          });
        },

        /*
          DRAW FRAME FUNCTION - THE VISUAL DISPLAY ENGINE
          
          This is one of the most important functions in the entire application. It's responsible
          for displaying a single frame with all its annotations. Think of it like a photographer's
          darkroom where multiple images (the base frame + annotation overlays) are combined
          into one final picture.
          
          What this function does:
          1. Gets the frame image and all object positions for this frame
          2. Draws the base image on the canvas
          3. Positions all the annotation boxes correctly
          4. Updates visibility states and UI controls
          5. Updates the timeline slider position
          
          This function is called:
          - When seeking to a specific frame
          - During automatic playback for each frame
          - When annotations are modified
          - When importing existing annotations
        */
        drawFrame: function(frameNumber) {
          return new Promise((resolve, _) => {
            // Get the frame image along with all object annotations for this frame
            annotatedObjectsTracker.getFrameWithObjects(frameNumber).then((frameWithObjects) => {
              /*
                DRAW THE BASE IMAGE
                
                First, we draw the actual video frame onto our canvas. This is like
                putting a photo onto a table before adding sticky notes on top.
              */
              ctx.drawImage(frameWithObjects.img, 0, 0);

              /*
                POSITION ALL ANNOTATION BOXES
                
                Now we go through each tracked object and position its visual bounding box
                to match where the object is in this frame. It's like moving sticky notes
                to the correct positions on our photo.
              */
              for (let i = 0; i < frameWithObjects.objects.length; i++) {
                let object = frameWithObjects.objects[i];           // Current object data
                let annotatedObject = object.annotatedObject;       // The object's complete annotation history
                let annotatedFrame = object.annotatedFrame;         // The object's position in this specific frame

                if (annotatedFrame.isVisible()) {
                  /*
                    OBJECT IS VISIBLE - SHOW AND POSITION THE BOUNDING BOX
                    
                    When an object is visible in this frame, we need to:
                    1. Make its bounding box visible
                    2. Resize it to match the object size
                    3. Position it correctly over the object
                    4. Update the visibility checkbox
                  */
                  annotatedObject.dom.style.display = 'block';      // Make the box visible
                  annotatedObject.dom.style.width = annotatedFrame.bbox.width + 'px';   // Set box width
                  annotatedObject.dom.style.height = annotatedFrame.bbox.height + 'px'; // Set box height
                  annotatedObject.dom.style.left = annotatedFrame.bbox.x + 'px';        // Position from left edge
                  annotatedObject.dom.style.top = annotatedFrame.bbox.y + 'px';         // Position from top edge
                  annotatedObject.visible.prop('checked', true);    // Check the visibility checkbox
                } else {
                  /*
                    OBJECT IS NOT VISIBLE - HIDE THE BOUNDING BOX
                    
                    When an object is not visible in this frame (went off-screen, behind
                    something, etc.), we hide its bounding box and uncheck its visibility.
                  */
                  annotatedObject.dom.style.display = 'none';       // Hide the box
                  annotatedObject.visible.prop('checked', false);   // Uncheck the visibility checkbox
                }
              }

              /*
                HANDLE "HIDE OTHERS" FEATURE
                
                Some objects might have a "hide others" flag set. This is useful when you want
                to focus on just one object and hide all the rest. It's like putting a spotlight
                on one actor while dimming the lights on everyone else.
              */
              let shouldHideOthers = frameWithObjects.objects.some(o => o.annotatedObject.hideOthers);
              if (shouldHideOthers) {
                // Go through all objects and hide those that don't have the "hideOthers" flag
                for (let i = 0; i < frameWithObjects.objects.length; i++) {
                  let object = frameWithObjects.objects[i];
                  let annotatedObject = object.annotatedObject;
                  if (!annotatedObject.hideOthers) {
                    annotatedObject.dom.style.display = 'none'; // Hide this object's bounding box
                  }
                }
              }

              /*
                UPDATE TIMELINE SLIDER
                
                Move the timeline slider to show the current frame position.
                This keeps the slider in sync with what's being displayed.
              */
              slider.setPosition(this.currentFrame);

              resolve(); // Signal that we're done drawing this frame
            });
          });
        },

        /*
          DONE FUNCTION - END OF VIDEO CLEANUP
          
          This function is called when the video reaches the end during automatic playback.
          It resets the player to a stopped state and prepares for potential replay.
          
          Think of it like what happens when a DVD reaches the end - it stops playing
          and returns to a state where you can press play again.
        */
        done: function() {
          this.currentFrame = 0;     // Reset to the beginning for potential replay
          this.isPlaying = false;    // Mark as stopped

          // Reset UI buttons to stopped state
          playButton.disabled = false;        // Enable play button
          playButton.style.display = 'block'; // Show play button
          pauseButton.disabled = true;        // Disable pause button
          pauseButton.style.display = 'none'; // Hide pause button
        }
      };

      /*
        ANNOTATION CLEANUP FUNCTIONS - THE HOUSEKEEPING CREW
        
        These functions handle cleaning up annotation data when needed. Think of them
        like a cleaning crew that tidies up after a party - they remove objects that
        are no longer needed and free up memory.
        
        This is important because:
        1. Memory management: Removing unused objects prevents memory leaks
        2. UI cleanup: Removing DOM elements prevents visual clutter
        3. Data integrity: Ensuring the annotation list stays synchronized with what's actually displayed
      */

      /*
        CLEAR ALL ANNOTATED OBJECTS - THE COMPLETE RESET
        
        This function removes all annotations from the system. It's like erasing all
        the sticky notes from a photo and starting with a clean slate.
        
        Called when:
        - Loading a new video file
        - Resetting the application
        - Starting a fresh annotation session
      */
      function clearAllAnnotatedObjects() {
        // Go through each annotated object and clean it up individually
        // We need to work backwards or use while loop since clearAnnotatedObject modifies the array
        while (annotatedObjectsTracker.annotatedObjects.length > 0) {
          clearAnnotatedObject(0); // Always remove the first element
        }
      }

      /*
        CLEAR SINGLE ANNOTATED OBJECT - TARGETED CLEANUP
        
        This function removes one specific annotation object. It's like removing
        one specific sticky note from a photo while leaving all the others.
        
        The cleanup process involves:
        1. Removing the UI controls (name input, checkboxes, etc.)
        2. Removing the visual bounding box from the screen
        3. Removing the object from our tracking list
      */
      function clearAnnotatedObject(i) {
        let annotatedObject = annotatedObjectsTracker.annotatedObjects[i]; // Get the object to remove
        
        annotatedObject.controls.remove();  // Remove the UI control panel (jQuery removal)
        $(annotatedObject.dom).remove();    // Remove the visual bounding box (jQuery removal)
        annotatedObjectsTracker.annotatedObjects.splice(i, 1); // Remove from our tracking array
      }

      /*
        EVENT LISTENER SETUP - CONNECTING USER ACTIONS TO FUNCTIONS
        
        These lines set up "event listeners" - they're like hiring security guards to watch
        specific doors and call specific people when someone enters. Each event listener
        watches for a specific user action and calls a specific function when it happens.
        
        Think of it like programming a smart home system:
        - "When the doorbell rings, turn on the porch light"
        - "When someone opens the fridge, turn on the inside light"
        - "When the file input changes, call the extraction function"
        
        The 'false' parameter is a technical detail about event handling (it means "don't capture").
      */
      videoFile.addEventListener('change', extractionFileUploaded, false);    // When user selects a video file
      zipFile.addEventListener('change', extractionFileUploaded, false);      // When user selects a ZIP file
      xmlFile.addEventListener('change', importXml, false);                   // When user selects an XML file
      playButton.addEventListener('click', playClicked, false);               // When user clicks play button
      pauseButton.addEventListener('click', pauseClicked, false);             // When user clicks pause button
      downloadFramesButton.addEventListener('click', downloadFrames, false);  // When user clicks download button
      generateXmlButton.addEventListener('click', generateXml, false);        // When user clicks XML export button

      /*
        SIMPLE BUTTON CLICK HANDLERS - THE DELEGATION FUNCTIONS
        
        These are simple "wrapper" functions that just call the appropriate player methods.
        You might wonder "why not connect the event listeners directly to player.play()?"
        
        The reason is that event listeners pass extra parameters (event objects) to functions,
        but our player methods don't expect those parameters. These wrapper functions act
        like translators that convert "user clicked play button" into "player.play()".
        
        Think of them like receptionists who take messages and relay them to the right person
        in the right format.
      */
      function playClicked() {
        player.play();    // Tell the player to start playing
      }

      function pauseClicked() {
        player.pause();   // Tell the player to pause
      }

      /*
        DOWNLOAD FRAMES FUNCTION - THE FRAME PACKAGER
        
        This function takes all the extracted video frames and packages them into a
        downloadable ZIP file. Think of it like taking all the pages from a disassembled
        flip-book and putting them in an envelope to mail to someone.
        
        The process:
        1. Create a new ZIP file container
        2. Go through each frame in our collection
        3. Add each frame to the ZIP with a sequential filename
        4. When all frames are added, generate the final ZIP file
        5. Trigger a download to the user's computer
        
        This is useful for:
        - Backing up extracted frames
        - Sharing frames with other people
        - Using frames in other video editing software
        - Manual inspection of individual frames
      */
      function downloadFrames() {
        let zip = new JSZip(); // Create a new ZIP file container (like getting an empty box)

        let processed = 0; // Counter to track how many frames we've processed
        let totalFrames = framesManager.frames.totalFrames(); // Get total number of frames
        
        /*
          FRAME PROCESSING LOOP
          
          We go through each frame and add it to the ZIP. This is done asynchronously
          because getting frame data takes time (it might be stored in a database).
          
          Think of it like an assembly line where workers add items to boxes, but each
          worker might take different amounts of time to complete their task.
        */
        for (let i = 0; i < totalFrames; i++) {
          framesManager.frames.getFrame(i).then((blob) => { // Get frame data as a blob
            zip.file(i + '.jpg', blob); // Add this frame to the ZIP with filename "0.jpg", "1.jpg", etc.

            processed++; // Increment our completion counter
            
            /*
              CHECK IF ALL FRAMES ARE PROCESSED
              
              When we've processed all frames, generate and download the ZIP file.
              We can't do this earlier because the frame processing is asynchronous
              (they might finish in a different order than they started).
            */
            if (processed == totalFrames) {
              /*
                GENERATE AND DOWNLOAD THE ZIP FILE
                
                This creates a streaming download - the ZIP file is generated and
                downloaded in chunks rather than loading everything into memory at once.
                This prevents memory issues with large videos.
              */
              let writeStream = streamSaver.createWriteStream('extracted-frames.zip').getWriter();
              zip.generateInternalStream({type: 'uint8array', streamFiles: true})
                 .on('data', data => writeStream.write(data))  // Write each chunk as it's generated
                 .on('end', () => writeStream.close())         // Close the file when done
                 .resume(); // Start the streaming process
            }
          });
        }
      }

      /*
        CANVAS DIMENSION INITIALIZATION - SETTING UP THE DRAWING AREA
        
        This function sets up the video display area to match the dimensions of the video.
        Think of it like choosing the right size picture frame for a photo - the frame
        needs to be exactly the right size or the photo won't fit properly.
        
        Why is this important?
        1. The canvas must match the video size for annotations to align correctly
        2. The container must be sized properly for the user interface to look right
        3. The slider width should match the video width for visual consistency
        
        This function is called whenever we load a new video, because different videos
        might have different dimensions (1920x1080, 640x480, etc.).
      */
      function initializeCanvasDimensions(img) {
        /*
          SET CONTAINER DIMENSIONS
          
          The 'doodle' container holds the video canvas and annotation overlays.
          We set its size to match the video so everything fits properly.
        */
        doodle.style.width = img.width + 'px';   // Set container width to match video
        doodle.style.height = img.height + 'px'; // Set container height to match video
        
        /*
          SET CANVAS DIMENSIONS
          
          The canvas is where we draw the video frames. It must be exactly the same
          size as the video or the images will be stretched or cropped.
        */
        canvas.width = img.width;   // Set canvas pixel width
        canvas.height = img.height; // Set canvas pixel height
        
        /*
          SET SLIDER WIDTH
          
          Make the timeline slider the same width as the video for visual consistency.
          This creates a pleasing aligned layout where the slider spans the full video width.
        */
        sliderElement.style.width = img.width + 'px';
      }

      /*
        FILE UPLOAD HANDLER - THE MAIN WORKFLOW COORDINATOR
        
        This is one of the most important functions in the application. It handles what happens
        when a user selects a file (either video or ZIP). Think of it like the main conductor
        of an orchestra - it coordinates all the different parts to work together in the right sequence.
        
        The workflow:
        1. Disable all controls while processing (prevent user from breaking things)
        2. Clear any existing annotations (start fresh)
        3. Reset the player and interface
        4. Determine file type and extract frames accordingly
        5. Set up the interface for annotation work
        6. Re-enable appropriate controls
        
        This function is called by the event listeners when videoFile or zipFile inputs change.
        The 'this' keyword refers to whichever file input triggered the event.
      */
      function extractionFileUploaded() {
        /*
          SAFETY CHECK - ENSURE ONE FILE SELECTED
          
          Make sure the user actually selected a file. The files array might be empty
          if the user opened the file dialog but then cancelled without selecting anything.
        */
        if (this.files.length != 1) {
          return; // Exit early if no file or multiple files selected
        }

        /*
          DISABLE ALL CONTROLS - PREVENT USER INTERFERENCE
          
          While we're processing the file, we disable all the buttons and inputs to prevent
          the user from clicking things that might interfere with the process. It's like
          putting up "Under Construction" signs around a work area.
          
          This prevents confusing situations like:
          - User clicking play while frames are still being extracted
          - User loading a second file while the first is still processing
          - User trying to export annotations before any exist
        */
        videoFile.disabled = true;               // Disable video file input
        zipFile.disabled = true;                 // Disable ZIP file input
        xmlFile.disabled = true;                 // Disable XML file input
        downloadFramesButton.disabled = true;   // Disable download button
        generateXmlButton.disabled = true;      // Disable XML export button
        exportVideoButton.disabled = true;      // Disable video export button
        exportAnnotatedZipButton.disabled = true; // Disable annotated ZIP export button
        
        /*
          CLEAN SLATE PREPARATION
          
          Clear any existing work and reset the interface to prepare for the new file.
          This ensures we don't have leftover data from a previous session interfering
          with the new file.
        */
        clearAllAnnotatedObjects(); // Remove all existing annotations
        slider.reset();              // Disable and reset the timeline slider
        player.initialize();         // Reset the player to initial state

        /*
          DETERMINE FILE TYPE AND PROCESSING METHOD
          
          We need to handle video files and ZIP files differently:
          - Video files: Extract frames using the video processing engine
          - ZIP files: Read pre-extracted frames from the archive
          
          We determine which type by checking which input element triggered this function.
        */
        let promise; // Variable to hold the extraction promise
        
        if (this == videoFile) {
          /*
            VIDEO FILE PROCESSING BRANCH
            
            When processing a video file, we need to:
            1. Extract individual frames from the video
            2. Show progress to the user
            3. Display preview frames as they're processed
            4. Handle dimension detection
          */
          let dimensionsInitialized = false; // Flag to track if we've set up canvas dimensions

          promise = extractFramesFromVideo(
            config,           // Configuration settings
            this.files[0],    // The selected video file
            /*
              PROGRESS CALLBACK FUNCTION
              
              This function is called repeatedly during extraction to show progress.
              It receives information about how much work is done and the latest frame.
              
              Think of it like a construction foreman calling you every hour to say
              "We're 25% done, and here's a photo of the current progress."
            */
            (percentage, framesSoFar, lastFrameBlob) => {
              // Convert the latest frame blob to an image we can display
              blobToImage(lastFrameBlob).then((img) => {
                /*
                  FIRST FRAME DIMENSION SETUP
                  
                  When we get the first frame, we use it to set up the canvas dimensions.
                  We only do this once (hence the flag) because all frames should have
                  the same dimensions.
                */
                if (!dimensionsInitialized) {
                  dimensionsInitialized = true;
                  initializeCanvasDimensions(img); // Set up canvas to match video size
                }
                
                ctx.drawImage(img, 0, 0); // Display the latest frame as a preview

                /*
                  UPDATE PROGRESS DISPLAYS
                  
                  Show the user how the extraction is progressing with both text updates.
                  This keeps them informed and prevents them from thinking the app is frozen.
                */
                videoDimensionsElement.innerHTML = 'Video dimensions determined: ' + img.width + 'x' + img.height;
                extractionProgressElement.innerHTML = (percentage * 100).toFixed(2) + ' % completed. ' + framesSoFar + ' frames extracted.';
              });
            });
        } else {
          /*
            ZIP FILE PROCESSING BRANCH
            
            When processing a ZIP file, the frames are already extracted, so we just
            need to read them from the archive. This is much faster than video extraction.
          */
          promise = extractFramesFromZip(config, this.files[0]);
        }

        /*
          POST-EXTRACTION PROCESSING - SETTING UP FOR ANNOTATION WORK
          
          When the frame extraction is complete (either from video or ZIP), we need to
          set up the interface for annotation work. This is like setting up all your
          art supplies after you've gotten your canvas ready.
          
          The .then() means "when the extraction promise is complete, do this..."
        */
        promise.then((frames) => {
          /*
            UPDATE COMPLETION STATUS
            
            Show the user that extraction is complete and how many frames were found.
          */
          extractionProgressElement.innerHTML = 'Extraction completed. ' + frames.totalFrames() + ' frames captured.';
          
          /*
            SETUP FOR ANNOTATION WORK - BUT ONLY IF WE HAVE FRAMES
            
            If the extraction found at least one frame, set up the interface for annotation.
            If no frames were found, skip this setup (empty video or corrupted file).
          */
          if (frames.totalFrames() > 0) {
            /*
              DISPLAY THE FIRST FRAME
              
              Show the first frame of the video as a starting point. This gives the user
              something to look at and lets them see what they'll be working with.
            */
            frames.getFrame(0).then((blob) => {
              blobToImage(blob).then((img) => {
                /*
                  FINAL SETUP STEPS
                  
                  Complete the interface setup now that we have frame data.
                */
                initializeCanvasDimensions(img); // Set canvas dimensions (in case this wasn't done during progress)
                ctx.drawImage(img, 0, 0);        // Display the first frame
                videoDimensionsElement.innerHTML = 'Video dimensions determined: ' + img.width + 'x' + img.height;

                /*
                  CONNECT THE FRAME MANAGER
                  
                  Give our frames to the frame manager. This triggers any reset callbacks
                  and makes the frames available to the rest of the application.
                */
                framesManager.set(frames);
                
                /*
                  INITIALIZE THE TIMELINE SLIDER
                  
                  Set up the slider to span from frame 0 to the last frame, and define
                  what happens when the user moves it (seek to that frame).
                */
                slider.init(
                  0,                                    // Minimum value (first frame)
                  framesManager.frames.totalFrames() - 1, // Maximum value (last frame)
                  (frameNumber) => player.seek(frameNumber) // What to do when slider moves
                );
                
                /*
                  ENABLE THE PLAYER
                  
                  Mark the player as ready for use. This enables the play button and
                  allows the user to start interacting with the video.
                */
                player.ready();

                /*
                  RE-ENABLE INTERFACE CONTROLS
                  
                  Now that everything is set up, re-enable all the controls that we
                  disabled at the beginning. The user can now start annotating!
                */
                xmlFile.disabled = false;                // Allow XML import
                playButton.disabled = false;             // Allow video playback
                downloadFramesButton.disabled = false;   // Allow frame download
                generateXmlButton.disabled = false;      // Allow XML export
                exportVideoButton.disabled = false;      // Allow video export
                exportAnnotatedZipButton.disabled = false; // Allow annotated ZIP export
              });
            });
          }

          /*
            FINAL CLEANUP - RE-ENABLE FILE INPUTS
            
            Re-enable the file input controls so the user can load a different file if needed.
            We do this regardless of whether frame extraction was successful or not.
          */
          videoFile.disabled = false; // Re-enable video file input
          zipFile.disabled = false;   // Re-enable ZIP file input
        });
      }

      /*
        INTERACTIFY FUNCTION - MAKING BOUNDING BOXES INTERACTIVE
        
        This function takes a static HTML element and makes it into an interactive bounding box
        that users can resize and drag around. Think of it like turning a picture frame into
        a smart picture frame that can resize itself and move around on the wall.
        
        What this function adds:
        1. Resize handles on the edges (like corner handles on a window)
        2. Drag capability (like being able to move the whole window)
        3. Containment (can't be dragged outside the video area)
        4. Callback function when changes are made
        
        This uses jQuery UI widgets (resizable and draggable) to provide the interactive functionality.
        It's like installing power steering and power windows in a basic car.
      */
      function interactify(dom, onChange) {
        let bbox = $(dom); // Convert to jQuery object for easier manipulation
        bbox.addClass('bbox'); // Add CSS class for styling

        /*
          CREATE RESIZE HANDLE HELPER FUNCTION
          
          This helper function creates the small visual handles that appear on the edges
          of a bounding box for resizing. Think of them like the little squares that
          appear on the corners of a selected image in a word processor.
        */
        let createHandleDiv = (className) => {
          let handle = document.createElement('div'); // Create a new div element
          handle.className = className;               // Set its CSS class for styling
          bbox.append(handle);                        // Add it to the bounding box
          return handle;                              // Return the handle for use
        };

        /*
          MAKE THE BOUNDING BOX RESIZABLE
          
          This adds resize functionality to the bounding box. Users can drag the edges
          to make it bigger or smaller, like resizing a window.
        */
        bbox.resizable({
          containment: 'parent', // Can't resize outside the video area
          handles: {
            // Create handles for each edge: North, South, East, West
            n: createHandleDiv('ui-resizable-handle ui-resizable-n'), // Top edge
            s: createHandleDiv('ui-resizable-handle ui-resizable-s'), // Bottom edge
            e: createHandleDiv('ui-resizable-handle ui-resizable-e'), // Right edge
            w: createHandleDiv('ui-resizable-handle ui-resizable-w')  // Left edge
          },
          /*
            RESIZE COMPLETION CALLBACK
            
            When the user finishes resizing, get the new position and size and
            call the onChange function to update the annotation data.
          */
          stop: (e, ui) => {
            let position = bbox.position(); // Get current position
            // Call onChange with rounded values (pixels should be whole numbers)
            onChange(Math.round(position.left), Math.round(position.top), Math.round(bbox.width()), Math.round(bbox.height()));
          }
        });

        /*
          MAKE THE BOUNDING BOX DRAGGABLE
          
          This allows users to drag the entire bounding box to a new position,
          like moving a sticky note to a different part of a photo.
        */
        bbox.draggable({
          containment: 'parent', // Can't drag outside the video area
          handle: createHandleDiv('handle center-drag'), // Create a central drag handle
          /*
            DRAG COMPLETION CALLBACK
            
            When the user finishes dragging, get the new position and call
            the onChange function to update the annotation data.
          */
          stop: (e, ui) => {
            let position = bbox.position(); // Get new position
            // Call onChange with current position and unchanged size
            onChange(Math.round(position.left), Math.round(position.top), Math.round(bbox.width()), Math.round(bbox.height()));
          }
        });
      }

      /*
        MOUSE TRACKING OBJECT - THE CURSOR POSITION MONITOR
        
        This object keeps track of where the mouse cursor is positioned within the video area.
        Think of it like having a GPS system that always knows exactly where you are on a map.
        
        Why do we need this?
        When users are drawing bounding boxes, we need to know:
        1. Where they first clicked (starting corner)
        2. Where they're currently dragging to (current corner)
        3. The difference between these points (the box size)
        
        We store both current position and starting position so we can calculate
        the bounding box dimensions as the user drags.
      */
      let mouse = {
        x: 0,      // Current mouse X position relative to the video
        y: 0,      // Current mouse Y position relative to the video
        startX: 0, // X position where user first clicked to start drawing
        startY: 0  // Y position where user first clicked to start drawing
      };

      /*
        TEMPORARY ANNOTATION OBJECT - THE WORK-IN-PROGRESS TRACKER
        
        When a user is in the middle of drawing a new bounding box, we need to track
        the box being created before it becomes a "real" annotation. This variable
        holds that temporary box.
        
        Think of it like a rough sketch that you're working on before making it into
        a final drawing. When it's null, no box is being drawn. When it has a value,
        the user is actively drawing a box.
      */
      let tmpAnnotatedObject = null;

      /*
        MOUSE MOVE EVENT HANDLER - THE REAL-TIME POSITION TRACKER
        
        This function is called every time the mouse moves over the video area. It's like
        having a motion sensor that constantly reports "now the mouse is here, now it's here."
        
        The function does two main things:
        1. Updates our mouse position tracking (for all interactions)
        2. If a bounding box is being drawn, updates its size in real-time
        
        This creates the "rubber band" effect where you can see the box growing and
        shrinking as you drag the mouse around.
      */
      doodle.onmousemove = function (e) {
        /*
          CROSS-BROWSER MOUSE POSITION DETECTION
          
          Different browsers provide mouse position information in slightly different ways.
          This code tries multiple methods to ensure it works everywhere.
          
          Think of it like asking for directions in a foreign country - you try different
          ways of asking until someone understands and gives you the information you need.
        */
        let ev = e || window.event; // Get the event object (cross-browser compatible)
        
        if (ev.pageX) {
          // Method 1: pageX/pageY (most modern browsers)
          mouse.x = ev.pageX;
          mouse.y = ev.pageY;
        } else if (ev.clientX) {
          // Method 2: clientX/clientY (older browsers)
          mouse.x = ev.clientX;
          mouse.y = ev.clientY;
        }
        
        /*
          CONVERT TO VIDEO-RELATIVE COORDINATES
          
          The mouse positions we got above are relative to the entire webpage, but we need
          positions relative to just the video area. We subtract the video area's position
          to get local coordinates.
          
          Think of it like converting from "5 miles east of the city center" to 
          "5 blocks east of our neighborhood."
        */
        mouse.x -= doodle.offsetLeft; // Subtract video area's left offset
        mouse.y -= doodle.offsetTop;  // Subtract video area's top offset

        /*
          REAL-TIME BOUNDING BOX DRAWING UPDATE
          
          If the user is currently drawing a bounding box (tmpAnnotatedObject exists),
          update its size and position based on the current mouse position.
          
          This creates the visual feedback where the box stretches as you drag.
        */
        if (tmpAnnotatedObject !== null) {
          /*
            CALCULATE BOX DIMENSIONS
            
            The bounding box size is the distance between where the user first clicked
            (startX, startY) and where the mouse currently is (x, y).
            
            We use Math.abs() because the user might drag in any direction, and we
            always want positive width and height values.
          */
          tmpAnnotatedObject.width = Math.abs(mouse.x - mouse.startX);   // Distance horizontally
          tmpAnnotatedObject.height = Math.abs(mouse.y - mouse.startY);  // Distance vertically
          
          /*
            CALCULATE BOX POSITION
            
            The box position (top-left corner) depends on which direction the user dragged.
            If they dragged up and to the left, the current mouse position becomes the
            top-left corner. If they dragged down and to the right, the starting position
            is the top-left corner.
            
            This ensures the box always appears in the right place regardless of drag direction.
          */
          tmpAnnotatedObject.x = (mouse.x - mouse.startX < 0) ? mouse.x : mouse.startX;     // Leftmost position
          tmpAnnotatedObject.y = (mouse.y - mouse.startY < 0) ? mouse.y : mouse.startY;     // Topmost position

          /*
            UPDATE THE VISUAL BOUNDING BOX
            
            Apply the calculated dimensions and position to the actual HTML element
            so the user can see the box being drawn in real-time.
          */
          tmpAnnotatedObject.dom.style.width = tmpAnnotatedObject.width + 'px';   // Set visual width
          tmpAnnotatedObject.dom.style.height = tmpAnnotatedObject.height + 'px'; // Set visual height
          tmpAnnotatedObject.dom.style.left = tmpAnnotatedObject.x + 'px';        // Set visual X position
          tmpAnnotatedObject.dom.style.top = tmpAnnotatedObject.y + 'px';         // Set visual Y position
        }
      }

      /*
        MOUSE CLICK EVENT HANDLER - THE ANNOTATION CREATION CONTROLLER
        
        This is one of the most complex and important functions in the application. It handles
        the two-click process for creating new bounding box annotations. Think of it like a
        state machine that manages the annotation creation workflow.
        
        The Two-Click Process:
        1. First click: Start drawing a new bounding box (if in crosshair mode)
        2. Second click: Finalize the bounding box and create the annotation
        
        The function behaves differently depending on the current state:
        - If cursor is not in crosshair mode: Do nothing (normal cursor behavior)
        - If no box is being drawn: Start drawing a new box
        - If a box is being drawn: Finish the box and create the annotation
        
        This is like having a drawing tool that works in two steps: "start drawing" and "finish drawing."
      */
      doodle.onclick = function (e) {
        /*
          MODE CHECK - ONLY WORK IN ANNOTATION MODE
          
          Only proceed if the cursor is in "crosshair" mode, which indicates the user
          is ready to create annotations. If the cursor is normal, the user is just
          navigating and we shouldn't create annotations on random clicks.
        */
        if (doodle.style.cursor != 'crosshair') {
          return; // Exit early if not in annotation mode
        }

        if (tmpAnnotatedObject != null) {
          /*
            SECOND CLICK - FINALIZE THE ANNOTATION
            
            The user has finished drawing the bounding box and clicked to complete it.
            Now we need to convert the temporary drawing into a real annotation object.
          */
          
          // Create a new permanent annotation object
          let annotatedObject = new AnnotatedObject();
          annotatedObject.dom = tmpAnnotatedObject.dom; // Use the visual element we created
          
          // Get the currently selected class and assign it to the annotation
          const selectedClass = getCurrentAnnotationClass();
          if (selectedClass) {
            annotatedObject.className = selectedClass;
            annotatedObject.color = getClassColor(selectedClass);
            
            // Update the visual element color
            tmpAnnotatedObject.dom.style.borderColor = annotatedObject.color;
          } else {
            annotatedObject.color = '#FF0000'; // Set default red color for new annotations
          }
          
          // Create the bounding box data structure
          let bbox = new BoundingBox(tmpAnnotatedObject.x, tmpAnnotatedObject.y, tmpAnnotatedObject.width, tmpAnnotatedObject.height);
          
          // Create an annotation frame for the current frame (marked as ground truth because human-created)
          annotatedObject.add(new AnnotatedFrame(player.currentFrame, bbox, true));
          
          // Add the object to our tracking system
          annotatedObjectsTracker.annotatedObjects.push(annotatedObject);
          
          // Create annotation card in the individual annotations UI
          if (window.annotationManager) {
            const classInfo = selectedClass ? {
              name: selectedClass,
              color: annotatedObject.color
            } : null;
            
            window.annotationManager.createAnnotationCard(annotatedObject, classInfo);
          }
          
          // Clear the temporary object (we're done with it)
          tmpAnnotatedObject = null;

          /*
            MAKE THE ANNOTATION INTERACTIVE
            
            Enable resize and drag functionality for the newly created annotation.
            The onChange callback updates the annotation when the user modifies it.
          */
          interactify(
            annotatedObject.dom,
            (x, y, width, height) => {
              let bbox = new BoundingBox(x, y, width, height);
              annotatedObject.add(new AnnotatedFrame(player.currentFrame, bbox, true));
            }
          );

          // Add UI controls for this annotation (name, visibility, etc.)
          addAnnotatedObjectControls(annotatedObject);

          // Return cursor to normal mode (annotation creation complete)
          doodle.style.cursor = 'default';
        } else {
          /*
            FIRST CLICK - START DRAWING A NEW ANNOTATION
            
            The user wants to start drawing a new bounding box. Record the starting
            position and create a temporary visual element.
          */
          
          // Record where the user clicked as the starting corner
          mouse.startX = mouse.x;
          mouse.startY = mouse.y;

          // Create a new visual bounding box element
          let dom = newBboxElement();
          dom.style.left = mouse.x + 'px';  // Position at click location
          dom.style.top = mouse.y + 'px';   // Position at click location
          
          // Create temporary object to track the drawing process
          tmpAnnotatedObject = { dom: dom };
        }
      }

      /*
        NEW BOUNDING BOX ELEMENT FACTORY - THE BOX CREATOR
        
        This function creates a new visual bounding box element that will appear on screen.
        Think of it like a factory that stamps out identical rectangular frames that can
        be placed over objects in the video.
        
        The process:
        1. Create a new HTML div element (like cutting out a rectangular piece of paper)
        2. Give it the 'bbox' CSS class for styling (like coloring the paper border red)
        3. Add it to the video display area (like placing the paper frame on top of a photo)
        4. Return the element so other code can position and size it
      */
      function newBboxElement() {
          let dom = document.createElement('div'); // Create a new rectangular HTML element
          dom.className = 'bbox';                  // Apply the bounding box CSS styling
          doodle.appendChild(dom);                 // Add it to the video display area
          return dom;                              // Give back the element for further use
      }

      /*
        ADD ANNOTATION CONTROLS - THE CONTROL PANEL CREATOR
        
        This function creates a complete control panel for managing a single annotation.
        Think of it like building a dashboard for each annotated object, with buttons,
        text boxes, and switches that let the user control that specific annotation.
        
        For each annotation, we create:
        1. Name input field - what to call this object ("car", "person", etc.)
        2. ID input field - unique identifier for tracking
        3. Visibility checkbox - show/hide this annotation
        4. "Hide others" checkbox - focus mode to show only this annotation
        5. Delete button - remove this annotation completely
        
        All these controls are packaged together in a bordered box and added to the
        controls area of the interface.
        
        Think of it like creating a remote control that's specifically designed to
        operate one TV - each annotation gets its own custom remote control.
      */
      function addAnnotatedObjectControls(annotatedObject) {
        /*
          CREATE NAME INPUT FIELD - THE OBJECT LABEL EDITOR
          
          This creates a text input where users can type what kind of object this is.
          Think of it like a name tag that you can write on - "Hello, my name is ____"
          
          Default value is "Name?" to prompt the user to change it.
          We listen for any kind of text change (typing, pasting, etc.) and immediately
          save the new name to the annotation object.
        */
        let name = $('<input type="text" value="Name?" />');
        if (annotatedObject.name) {          // If the object already has a name
          name.val(annotatedObject.name);    // Pre-fill the input with the existing name
        }
        name.on('change keyup paste mouseup', function() {
          annotatedObject.name = this.value; // Save any changes immediately
        });

        /*
          CREATE CLASS DROPDOWN - THE OBJECT CATEGORY SELECTOR
          
          This creates a dropdown where users can select which class/category this
          annotation belongs to. Think of it like sorting items into labeled boxes -
          "Vehicles", "People", "Buildings", etc.
          
          When a class is selected:
          1. The annotation gets assigned a class name
          2. The bounding box color changes to match the class color
          3. The control panel border updates to match the class color
        */
        let classLabel = $('<label>Class: </label>');
        let classDropdown = $('<select style="width: 100%; margin-bottom: 5px;"></select>');
        
        // Add default option
        classDropdown.append('<option value="">Select Class...</option>');
        
        // Add all available classes to the dropdown
        const availableClasses = getAllClasses();
        Object.keys(availableClasses).forEach(className => {
          const color = availableClasses[className];
          classDropdown.append(`<option value="${className}">${className.charAt(0).toUpperCase() + className.slice(1)}</option>`);
        });
        
        // Set current selection if object already has a class
        if (annotatedObject.className) {
          classDropdown.val(annotatedObject.className);
        }
        
        classDropdown.on('change', function() {
          const selectedClassName = this.value;
          if (selectedClassName) {
            // Assign class information to the annotation
            annotatedObject.className = selectedClassName;
            
            // Update colors to match the class
            const classColor = getClassColor(selectedClassName);
            annotatedObject.color = classColor;
            color.val(classColor);
            
            // Update visual elements with new color
            if (annotatedObject.dom) {
              annotatedObject.dom.style.borderColor = classColor;
            }
            div.css('border-color', classColor);
          }
        });

        /*
          CREATE COMMENT TEXTAREA - THE ANNOTATION NOTES FIELD
          
          This creates a textarea where users can add detailed comments or notes about
          the annotation. Think of it like adding a sticky note to a photo with additional
          context or observations about the annotated object.
          
          The textarea can be vertically stretched to accommodate longer comments, and
          the comment text is automatically saved with the annotation data.
        */
        let comment = $('<textarea placeholder="Comments..." rows="3" style="width: 100%; resize: vertical;"></textarea>');
        if (annotatedObject.comment) {          // If the object already has a comment
          comment.val(annotatedObject.comment); // Pre-fill the textarea with the existing comment
        }
        comment.on('change keyup paste mouseup', function() {
          annotatedObject.comment = this.value; // Save any changes immediately
        });

        /*
          CREATE COLOR PICKER - THE ANNOTATION COLOR SELECTOR
          
          This creates a color input that allows users to choose a custom color for
          each annotation. Think of it like selecting a highlighter color for marking
          different objects - red for cars, blue for people, green for buildings, etc.
          
          The color affects both the bounding box appearance and the control panel styling.
        */
        let colorLabel = $('<label>Color: </label>');
        let color = $('<input type="color" value="#FF0000" style="width: 40px; height: 25px; border: none; cursor: pointer;" />');
        if (annotatedObject.color) {          // If the object already has a color
          color.val(annotatedObject.color);   // Pre-fill the color picker with existing color
        }
        color.on('change', function() {
          annotatedObject.color = this.value; // Save the selected color
          // Update the bounding box color immediately
          if (annotatedObject.dom) {
            annotatedObject.dom.style.borderColor = this.value;
          }
          // Update the control panel border color to match
          div.css('border-color', this.value);
        });

        /*
          CREATE VISIBILITY CHECKBOX - THE SHOW/HIDE TOGGLE
          
          This creates a checkbox that controls whether this annotation is visible
          in the current frame. Think of it like a light switch for each annotation.
          
          When checked: The bounding box appears on screen
          When unchecked: The bounding box is hidden
          
          This is useful for:
          - Hiding annotations when objects go off-screen
          - Temporarily hiding annotations to see the video more clearly
          - Marking frames where an object is not visible due to occlusion
        */
        let visibleLabel = $('<label>');                                // Container for checkbox and label
        let visible = $('<input type="checkbox" checked="checked" />'); // Checkbox (starts checked)
        annotatedObject.visible = visible;                              // Store reference for other code to use
        
        visible.change(function() {
          let bbox; // Variable to hold bounding box data
          
          if (this.checked) {
            /*
              CHECKBOX WAS CHECKED - MAKE ANNOTATION VISIBLE
              
              Show the bounding box on screen and record its current position/size
              as an annotation for this frame. This tells the system "the object
              is visible at this location in this frame."
            */
            annotatedObject.dom.style.display = 'block'; // Show the bounding box
            let jquery = $(annotatedObject.dom);          // Convert to jQuery for easier measurement
            let position = jquery.position();             // Get current position
            
            // Create bounding box data with current position and size (rounded to whole pixels)
            bbox = new BoundingBox(Math.round(position.left), Math.round(position.top), Math.round(jquery.width()), Math.round(jquery.height()));
          } else {
            /*
              CHECKBOX WAS UNCHECKED - HIDE ANNOTATION
              
              Hide the bounding box and record that the object is not visible
              in this frame. This tells the system "the object is not visible
              in this frame" (maybe it went off-screen or behind something).
            */
            annotatedObject.dom.style.display = 'none'; // Hide the bounding box
            bbox = null; // No bounding box data (object not visible)
          }
          
          // Record the visibility state for this frame (marked as ground truth because human-set)
          annotatedObject.add(new AnnotatedFrame(player.currentFrame, bbox, true));
        });
        visibleLabel.append(visible);           // Add checkbox to label
        visibleLabel.append('Is visible?');     // Add descriptive text

        /*
          CREATE "HIDE OTHERS" CHECKBOX - THE FOCUS MODE TOGGLE
          
          This creates a checkbox for "focus mode" - when enabled, all other annotations
          are hidden so the user can focus on just this one object. Think of it like
          using a spotlight in a dark room to highlight one specific thing.
          
          This is useful for:
          - Focusing on one object when the screen is cluttered with many annotations
          - Taking screenshots or recordings that highlight a specific object
          - Reducing visual distraction during detailed annotation work
        */
        let hideLabel = $('<label>');                    // Container for checkbox and label
        let hide = $('<input type="checkbox" />');       // Checkbox (starts unchecked)
        hide.change(function() {
          annotatedObject.hideOthers = this.checked;    // Save the focus mode setting
        });
        hideLabel.append(hide);                          // Add checkbox to label
        hideLabel.append('Hide others?');                // Add descriptive text

        /*
          CREATE DELETE BUTTON - THE ANNOTATION REMOVER
          
          This creates a button that completely removes this annotation from the system.
          Think of it like a "shred" button that permanently destroys a document.
          
          When clicked:
          1. Find this annotation in the master list
          2. Remove all its visual elements from the screen
          3. Remove all its data from memory
          4. Remove its control panel
          
          This is a permanent action that can't be undone (no "undo" feature implemented).
        */
        let del = $('<input type="button" value="Delete" />');
        del.click(function() {
          // Search through all annotations to find this specific one
          for (let i = 0; i < annotatedObjectsTracker.annotatedObjects.length; i++) {
            if (annotatedObject === annotatedObjectsTracker.annotatedObjects[i]) {
              clearAnnotatedObject(i); // Remove this annotation completely
              break; // Stop searching once we found and removed it
            }
          }
        });

        /*
          ASSEMBLE THE CONTROL PANEL - PUTTING ALL PIECES TOGETHER
          
          Now we take all the individual controls we created and assemble them into
          a single control panel. Think of it like putting all the buttons and switches
          into a control box with a border around it.
          
          The layout is:
          - Name input field
          - ID input field
          - Comment textarea (vertically stretchable)
          - Visibility checkbox
          - Hide others checkbox
          - Delete button
          
          All separated by line breaks for readability.
        */
        let div = $('<div></div>'); // Create container for all controls
        let borderColor = annotatedObject.color || '#FF0000'; // Use object's color or default red
        div.css({
          'border': '2px solid ' + borderColor, // Border color matches annotation color
          'display': 'inline-block',       // Display as a box that sits next to other boxes
          'margin': '5px',                 // Space between this and other control panels
          'padding': '10px'                // Space between border and contents
        });
        
        // Add all the controls in order, with line breaks between them
        div.append(name);               // Name input field
        div.append($('<br />'));        // Line break
        div.append(id);                 // ID input field
        div.append($('<br />'));        // Line break
        div.append(comment);            // Comment textarea (vertically aligned with name and id)
        div.append($('<br />'));        // Line break
        div.append(colorLabel);         // Color label
        div.append(color);              // Color picker input
        div.append($('<br />'));        // Line break
        div.append(visibleLabel);       // Visibility checkbox with label
        div.append($('<br />'));        // Line break
        div.append(hideLabel);          // Hide others checkbox with label
        div.append($('<br />'));        // Line break
        div.append(del);                // Delete button

        annotatedObject.controls = div; // Store reference so we can remove it later

        $('#objects').append(div);      // Add the control panel to the objects area in the UI
      }

      /*
        GENERATE XML FUNCTION - THE ANNOTATION DATA EXPORTER
        
        This function converts all the annotation data into an XML file that can be
        saved and shared. Think of it like taking all the sticky notes you've placed
        on a photo and writing them down in a detailed report that someone else could
        use to recreate your annotations.
        
        XML (eXtensible Markup Language) is a structured text format that looks like
        HTML but is designed for storing data. It's like a very organized filing system
        where everything has labels and is nested in a logical hierarchy.
        
        The XML format used here is compatible with VATIC (Video Annotation Tool from Irvine, California),
        which is a research tool for video annotation. This allows our annotations to be
        used in academic research or other video analysis tools.
        
        What gets exported:
        1. Basic video information (filename, source, etc.)
        2. For each annotated object: name, ID, and movement data
        3. For each frame: exact position coordinates of the object
        4. Ground truth flags (whether human-annotated or computer-predicted)
        
        The process:
        1. Build XML structure as a text string
        2. Go through each annotated object
        3. For each object, go through every frame and record its position
        4. Save the final XML text as a downloadable file
      */
      function generateXml() {
        /*
          BUILD XML HEADER AND METADATA
          
          Start building the XML file with standard headers and metadata.
          This is like writing the title page and table of contents of a report.
        */
        let xml = '<?xml version="1.0" encoding="utf-8"?>\n';  // XML format declaration
        xml += '<annotation>\n';                                // Root element (like book cover)
        xml += '  <folder>not available</folder>\n';           // Source folder (not applicable here)
        xml += '  <filename>not available</filename>\n';       // Source filename (not applicable here)
        xml += '  <source>\n';                                 // Information about data source
        xml += '    <type>video</type>\n';                     // Source type is video
        xml += '    <sourceImage>vatic frames</sourceImage>\n'; // Frame extraction method
        xml += '    <sourceAnnotation>vatic</sourceAnnotation>\n'; // Annotation format
        xml += '  </source>\n';

        /*
          EXPORT CLASS DEFINITIONS
          
          Include all available annotation classes in the XML export for reference.
          This allows the XML to be self-contained with class information.
        */
        if (typeof getAllClasses === 'function') {
          const classes = getAllClasses();
          if (Object.keys(classes).length > 0) {
            xml += '  <classes>\n';
            Object.entries(classes).forEach(([className, color]) => {
              xml += `    <class name="${className}" color="${color}" />\n`;
            });
            xml += '  </classes>\n';
          }
        }

        /*
          PROCESS EACH ANNOTATED OBJECT
          
          Go through every object that has been annotated and export its complete
          tracking data. This is like writing a separate chapter for each character
          in a movie, describing where they appear in every scene.
        */
        let totalFrames = framesManager.frames.totalFrames(); // Get total frame count for validation
        
        for (let i = 0; i < annotatedObjectsTracker.annotatedObjects.length; i++) {
          let annotatedObject = annotatedObjectsTracker.annotatedObjects[i];

          /*
            WRITE OBJECT METADATA
            
            For each object, first write its basic information like name and ID.
            This is like writing the character's name and basic info at the start
            of their chapter.
          */
          xml += '  <object>\n';
          xml += '    <name>' + annotatedObject.name + '</name>\n';      // Object name (car, person, etc.)
          xml += '    <moving>true</moving>\n';                          // Assume all objects can move
          xml += '    <action/>\n';                                     // No specific action recorded
          xml += '    <verified>0</verified>\n';                        // Not verified by second annotator
          xml += '    <id>' + annotatedObject.id + '</id>\n';          // Unique object identifier
          // Include comment if it exists and is not empty
          if (annotatedObject.comment && annotatedObject.comment.trim() !== '') {
            xml += '    <comment>' + annotatedObject.comment.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</comment>\n';
          }
          // Include color if it exists
          if (annotatedObject.color) {
            xml += '    <color>' + annotatedObject.color + '</color>\n';
          }
          // Include class if it exists
          if (annotatedObject.className) {
            xml += '    <class>' + annotatedObject.className + '</class>\n';
          }
          xml += '    <createdFrame>0</createdFrame>\n';                // Frame where object first appears
          xml += '    <startFrame>0</startFrame>\n';                    // Frame where tracking starts
          xml += '    <endFrame>' + (totalFrames - 1 ) + '</endFrame>\n'; // Frame where tracking ends

          /*
            WRITE FRAME-BY-FRAME POSITION DATA
            
            For each frame in the video, record where this object is positioned.
            This is like writing down the exact coordinates of where a character
            stands in every single scene of a movie.
            
            Each position is recorded as a "polygon" (even though it's really a rectangle)
            with four corner points. This format is compatible with research tools that
            might handle more complex shapes.
          */
          for (let frameNumber = 0; frameNumber < totalFrames; frameNumber++) {
            let annotatedFrame = annotatedObject.get(frameNumber); // Get object position in this frame
            
            /*
              SAFETY CHECK - ENSURE COMPLETE DATA
              
              Before exporting, make sure we have position data for every frame.
              If any frame is missing data, it means the user needs to play through
              the entire video first to generate complete tracking information.
            */
            if (annotatedFrame == null) {
              window.alert('Play the video in full before downloading the XML so that bounding box data is available for all frames.');
              return; // Exit early if data is incomplete
            }

            let bbox = annotatedFrame.bbox; // Get the bounding box for this frame
            
            if (bbox != null) {
              /*
                OBJECT IS VISIBLE - RECORD ITS POSITION
                
                When the object is visible in this frame, record its position as
                a four-point polygon. We convert the bounding box (x, y, width, height)
                into four corner coordinates.
                
                The format is: top-left, bottom-left, bottom-right, top-right
                This creates a clockwise path around the object's boundary.
              */
              let isGroundThrugh = annotatedFrame.isGroundTruth ? 1 : 0; // Convert boolean to number

              xml += '    '; // Indentation for readability
              xml += '<polygon>';                                           // Start polygon element
              xml += '<t>' + frameNumber + '</t>';                          // Frame number (time)
              xml += '<pt><x>' + bbox.x + '</x><y>' + bbox.y + '</y><l>' + isGroundThrugh + '</l></pt>'; // Top-left corner
              xml += '<pt><x>' + bbox.x + '</x><y>' + (bbox.y + bbox.height) + '</y><l>' + isGroundThrugh + '</l></pt>'; // Bottom-left corner
              xml += '<pt><x>' + (bbox.x + bbox.width) + '</x><y>' + (bbox.y + bbox.height) + '</y><l>' + isGroundThrugh + '</l></pt>'; // Bottom-right corner
              xml += '<pt><x>' + (bbox.x + bbox.width) + '</x><y>' + bbox.y + '</y><l>' + isGroundThrugh + '</l></pt>'; // Top-right corner
              xml += '</polygon>\n';                                        // End polygon element
            }
            // Note: If bbox is null (object not visible), we don't write anything for this frame
          }

          xml += '  </object>\n'; // End this object's data section
        }

        xml += '</annotation>\n'; // End the entire XML document

        /*
          SAVE XML FILE TO USER'S COMPUTER
          
          Take the XML text we built and save it as a downloadable file.
          This uses the streamSaver library to handle the file download without
          needing to load the entire file into memory (important for large videos).
          
          The process:
          1. Create a write stream for a file named "output.xml"
          2. Convert the XML text to bytes (using TextEncoder)
          3. Write the bytes to the stream
          4. Close the stream (triggers the download)
        */
        let writeStream = streamSaver.createWriteStream('output.xml').getWriter(); // Create download stream
        let encoder = new TextEncoder();                                           // Create text-to-bytes converter
        writeStream.write(encoder.encode(xml));                                   // Convert XML to bytes and write
        writeStream.close();                                                      // Close stream (starts download)
      }

      /*
        IMPORT XML FUNCTION - THE ANNOTATION DATA IMPORTER
        
        This function does the opposite of generateXml() - it reads an XML file containing
        annotation data and recreates all the annotations in our system. Think of it like
        taking someone else's detailed report about where objects are in a video and using
        it to automatically place all the sticky notes in the right positions.
        
        This is useful for:
        1. Loading previously saved annotation work to continue editing
        2. Sharing annotation data between different users or systems
        3. Importing annotations created by other tools (if they use VATIC format)
        4. Collaborating on annotation projects
        
        The process:
        1. Read the XML file content
        2. Parse the XML structure to extract object and position data
        3. Recreate annotation objects with their control panels
        4. Restore all the frame-by-frame position data
        5. Display everything in the interface
        
        This function is called when the user selects an XML file in the import input.
      */
      function importXml() {
        /*
          SAFETY CHECK - ENSURE ONE FILE SELECTED
          
          Make sure the user actually selected exactly one XML file. Don't proceed
          if no file or multiple files were selected.
        */
        if (this.files.length != 1) {
          return; // Exit early if file selection is invalid
        }

        /*
          SET UP FILE READER - THE XML CONTENT EXTRACTOR
          
          FileReader is a browser tool that can read the contents of files selected
          by the user. Think of it like a scanner that can read documents and convert
          them to digital text that our program can understand.
          
          We set up an "onload" callback that will be called when the file reading
          is complete. This is necessary because file reading is asynchronous (takes time).
        */
        var reader = new FileReader();
        reader.onload = (e) => {
          /*
            FILE READING STATUS CHECKS
            
            Before we can use the file content, we need to make sure the reading
            process completed successfully. FileReader goes through different states
            as it reads, and we only want to proceed when it's completely done (state 2).
          */
          if (e.target.readyState != 2) {  // 2 = DONE state
            return; // Exit if file reading isn't complete yet
          }

          if (e.target.error) {
            throw 'file reader error'; // Stop if there was an error reading the file
          }

          /*
            PARSE XML CONTENT - CONVERTING TEXT TO DATA STRUCTURE
            
            The file content is just a long text string containing XML markup.
            We need to parse it (analyze its structure) to extract the meaningful
            annotation data. Think of it like taking a written recipe and breaking
            it down into ingredients and steps.
            
            jQuery's parseXML function converts the XML text into a structured object
            that we can search through and extract data from.
          */
          let xml = $($.parseXML(e.target.result)); // Parse XML text into searchable structure
          
          /*
            IMPORT CLASS DEFINITIONS
            
            Check if the XML contains class definitions and import them.
            This ensures class information is available when creating annotations.
          */
          if (typeof importClassesFromXML === 'function') {
            importClassesFromXML($.parseXML(e.target.result));
          }
          
          let objects = xml.find('object');          // Find all <object> elements (annotated objects)
          
          /*
            RECREATE EACH ANNOTATED OBJECT
            
            Go through each object definition in the XML and recreate it in our system.
            This is like reading a guest list and setting up a name tag and seat for
            each person mentioned.
          */
          for (let i = 0; i < objects.length; i++) {
            let object = $(objects[i]);                    // Current object element from XML
            let name = object.find('n').text();           // Extract object name
            let id = object.find('id').text();             // Extract object ID
            let comment = object.find('comment').text();   // Extract object comment (if exists)
            let color = object.find('color').text();       // Extract object color (if exists)
            let className = object.find('class').text();   // Extract object class (if exists)

            /*
              CREATE NEW ANNOTATION OBJECT
              
              Build a new annotation object in our system using the data from the XML.
              This creates the internal data structure and visual bounding box.
            */
            let annotatedObject = new AnnotatedObject();  // Create new annotation object
            annotatedObject.name = name;                   // Set the name from XML
            annotatedObject.id = id;                       // Set the ID from XML
            if (comment) {                                 // Set the comment from XML if it exists
              annotatedObject.comment = comment;
            }
            if (color) {                                   // Set the color from XML if it exists
              annotatedObject.color = color;
            } else {
              annotatedObject.color = '#FF0000';       // Default to red if no color in XML
            }
            if (className) {                               // Set the class from XML if it exists
              annotatedObject.className = className;
              // Import the class if it doesn't exist in our class manager
              if (!annotationClasses.hasOwnProperty(className)) {
                annotationClasses[className] = color || '#FF0000';
                updateClassDisplay();
                updateClassDropdown();
              }
            }
            annotatedObject.dom = newBboxElement();        // Create visual bounding box element
            if (annotatedObject.color) {                   // Apply the color to the visual element
              annotatedObject.dom.style.borderColor = annotatedObject.color;
            }
            annotatedObjectsTracker.annotatedObjects.push(annotatedObject); // Add to tracking system
            
            // Create annotation card in the individual annotations UI for XML-loaded annotation
            if (window.annotationManager) {
              const classInfo = className ? {
                name: className,
                color: annotatedObject.color
              } : null;
              
              window.annotationManager.createAnnotationCard(annotatedObject, classInfo);
            }

            /*
              MAKE THE ANNOTATION INTERACTIVE
              
              Enable resize and drag functionality for this annotation, just like
              annotations created by hand. The onChange callback updates the annotation
              when the user modifies it after import.
            */
            interactify(
              annotatedObject.dom,
              (x, y, width, height) => {
                let bbox = new BoundingBox(x, y, width, height);
                annotatedObject.add(new AnnotatedFrame(player.currentFrame, bbox, true));
              }
            );

            // Create the control panel for this annotation (name input, checkboxes, etc.)
            addAnnotatedObjectControls(annotatedObject);

            /*
              RESTORE FRAME-BY-FRAME POSITION DATA
              
              Go through all the polygon elements in the XML and recreate the complete
              tracking history for this object. Each polygon represents where the object
              was positioned in a specific frame.
              
              This is like reading through a detailed log of where someone was at each
              moment in time and recreating their complete path of movement.
            */

            /*
              RESTORE FRAME-BY-FRAME POSITION DATA
              
              Go through all the polygon elements in the XML and recreate the complete
              tracking history for this object. Each polygon represents where the object
              was positioned in a specific frame.
              
              This is like reading through a detailed log of where someone was at each
              moment in time and recreating their complete path of movement.
            */
            let lastFrame = -1; // Track the last frame we processed (for gap detection)
            let polygons = object.find('polygon'); // Find all position records for this object
            
            for (let j = 0; j < polygons.length; j++) {
              let polygon = $(polygons[j]);                         // Current position record
              let frameNumber = parseInt(polygon.find('t').text()); // Which frame this position is for
              let pts = polygon.find('pt');                         // Get all four corner points
              let topLeft = $(pts[0]);                              // First point (top-left corner)
              let bottomRight = $(pts[2]);                          // Third point (bottom-right corner)
              let isGroundThrough = parseInt(topLeft.find('l').text()) == 1; // Whether human-annotated

              /*
                EXTRACT POSITION COORDINATES
                
                Convert the four-point polygon back into a simple bounding box.
                We only need the top-left and bottom-right corners to recreate
                the full rectangle. Think of it like knowing two opposite corners
                of a picture frame - that's enough to recreate the whole frame.
              */
              let x = parseInt(topLeft.find('x').text());      // Left edge position
              let y = parseInt(topLeft.find('y').text());      // Top edge position
              let w = parseInt(bottomRight.find('x').text()) - x; // Width (right edge - left edge)
              let h = parseInt(bottomRight.find('y').text()) - y; // Height (bottom edge - top edge)

              /*
                HANDLE FRAME GAPS - INVISIBLE PERIODS
                
                If there's a gap between the last frame we processed and this frame,
                it means the object was not visible during that period. We need to
                record this gap so the system knows the object was hidden.
                
                For example, if we processed frame 5 and now we're at frame 10,
                we need to record that the object was invisible from frame 6 to 9.
              */
              if (lastFrame + 1 != frameNumber) {
                // Create an "invisible" annotation frame for the gap period
                let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
                annotatedObject.add(annotatedFrame);
              }

              /*
                CREATE POSITION RECORD FOR THIS FRAME
                
                Create the bounding box and annotation frame for this specific position.
                This records exactly where the object was positioned in this frame.
              */
              let bbox = new BoundingBox(x, y, w, h); // Create bounding box with extracted coordinates
              let annotatedFrame = new AnnotatedFrame(frameNumber, bbox, isGroundThrough); // Create frame annotation
              annotatedObject.add(annotatedFrame); // Add to object's tracking history

              lastFrame = frameNumber; // Update our position for gap detection
            }

            /*
              HANDLE FINAL GAP - POST-TRACKING INVISIBILITY
              
              If the last position record doesn't go all the way to the end of the video,
              we need to record that the object becomes invisible for the remaining frames.
              
              For example, if the video has 100 frames but the last position record is
              for frame 80, we need to mark the object as invisible for frames 81-100.
            */
            if (lastFrame + 1 < framesManager.frames.totalFrames()) {
              let annotatedFrame = new AnnotatedFrame(lastFrame + 1, null, true);
              annotatedObject.add(annotatedFrame);
            }
          }

          /*
            REFRESH DISPLAY WITH IMPORTED DATA
            
            After importing all the annotation data, update the display to show the
            annotations for the current frame. This makes the imported annotations
            immediately visible to the user.
          */
          player.drawFrame(player.currentFrame);
        };
        
        /*
          START THE FILE READING PROCESS
          
          Tell the FileReader to start reading the selected XML file as text.
          When it's done, the onload callback we set up above will be called.
        */
        reader.readAsText(this.files[0]); // Read the selected file as text
      }

      /*
        KEYBOARD SHORTCUTS SYSTEM - THE HOTKEY CONTROLLER
        
        This function sets up keyboard shortcuts that make the annotation tool much faster
        and easier to use. Think of it like learning keyboard shortcuts in any software
        (Ctrl+C for copy, Ctrl+V for paste) - once you know them, you can work much more
        efficiently without constantly reaching for the mouse.
        
        The system works by listening for key presses anywhere on the page and checking
        which key was pressed. Based on the key, it performs the appropriate action.
        
        Why keyboard shortcuts are important for annotation:
        1. Speed: Much faster than clicking buttons with the mouse
        2. Workflow: Keep hands in annotation position without interruption
        3. Precision: Some actions (like frame stepping) need quick, repeated use
        4. Professional feel: Makes the tool feel responsive and professional
        
        The function returns whether to "preventDefault" - this tells the browser
        whether to block the normal action of the key (like spacebar scrolling the page).
      */
      window.onkeydown = function(e) {
        let preventDefault = true; // Assume we'll handle the key and block browser default

        if (e.keyCode === 32) { // SPACEBAR - PLAY/PAUSE TOGGLE
          /*
            SPACEBAR - THE UNIVERSAL PLAY/PAUSE KEY
            
            This is the most common video player shortcut. Every video player
            (YouTube, Netflix, VLC, etc.) uses spacebar for play/pause.
            
            Why spacebar?
            1. Large key that's easy to hit without looking
            2. Central location accessible to either hand
            3. Universal convention across all video software
            4. Natural "stop/go" feeling
          */
          player.toogle(); // Note: "toogle" is a typo in original code, should be "toggle"
        } else if (e.keyCode === 78) { // N KEY - NEW ANNOTATION MODE
          /*
            N KEY - ENTER ANNOTATION CREATION MODE
            
            Pressing 'N' (for "New") switches the cursor to crosshair mode, indicating
            the user can now click and drag to create a new bounding box annotation.
            
            Why 'N' key?
            1. 'N' for "New annotation"
            2. Easy to remember mnemonic
            3. Left hand position (keeps right hand free for mouse)
            4. Not used by browser for other functions
            
            After pressing 'N', the user can:
            1. Click once to start drawing a box
            2. Drag to size the box  
            3. Click again to finish the box
          */
          doodle.style.cursor = 'crosshair'; // Change cursor to indicate annotation mode
        } else if (e.keyCode === 27) { // ESCAPE KEY - CANCEL CURRENT ACTION
          /*
            ESCAPE KEY - THE UNIVERSAL CANCEL KEY
            
            Escape is the standard "get me out of here" key in almost all software.
            It cancels whatever action is currently in progress and returns to normal state.
            
            In annotation mode, Escape:
            1. Cancels any box currently being drawn (removes it completely)
            2. Returns cursor to normal mode (exits annotation creation)
            3. Clears any temporary state
            
            This gives users a safe "oops, I didn't mean to do that" option.
          */
          if (tmpAnnotatedObject != null) {
            /*
              CLEAN UP INCOMPLETE ANNOTATION
              
              If the user was in the middle of drawing a bounding box, remove it
              completely and clean up. This is like erasing a pencil sketch that
              you decided you don't want.
            */
            doodle.removeChild(tmpAnnotatedObject.dom); // Remove the visual element
            tmpAnnotatedObject = null;                   // Clear the temporary object
          }

          doodle.style.cursor = 'default'; // Return to normal cursor
        } else if (e.keyCode == 37) { // LEFT ARROW - PREVIOUS FRAME
          /*
            LEFT ARROW - STEP BACKWARD ONE FRAME
            
            This allows frame-by-frame navigation backward through the video.
            Think of it like the "previous page" function when reading a book.
            
            Why left arrow?
            1. Intuitive direction (left = backward in time)
            2. Standard convention in video editing software
            3. Natural position for repeated use
            4. Matches right arrow for forward
            
            This is essential for precise annotation work where you need to see
            exactly how objects move between individual frames.
          */
          player.seek(player.currentFrame - 1); // Go to the previous frame
        } else if (e.keyCode == 39) { // RIGHT ARROW - NEXT FRAME
          /*
            RIGHT ARROW - STEP FORWARD ONE FRAME
            
            This allows frame-by-frame navigation forward through the video.
            Think of it like the "next page" function when reading a book.
            
            Why right arrow?
            1. Intuitive direction (right = forward in time)
            2. Standard convention in video editing software
            3. Natural position for repeated use
            4. Matches left arrow for backward
            
            Combined with left arrow, this gives precise frame-level control
            for detailed annotation work.
          */
          player.seek(player.currentFrame + 1); // Go to the next frame
        } else {
          /*
            UNHANDLED KEY - LET BROWSER HANDLE IT
            
            If the pressed key isn't one of our shortcuts, we don't want to
            interfere with it. Set preventDefault to false so the browser
            can handle the key normally (typing in text fields, etc.).
          */
          preventDefault = false;
        }

        /*
          PREVENT DEFAULT BROWSER ACTION (IF NEEDED)
          
          If we handled the key press, prevent the browser from doing its
          normal action. For example, spacebar normally scrolls the page,
          but we want it to play/pause the video instead.
          
          This is like telling the browser "I've got this key handled,
          don't do your usual thing with it."
        */
        if (preventDefault) {
          e.preventDefault();
        }
      };

      /*
        EXPORT ANNOTATED VIDEO FUNCTION - THE VIDEO CREATOR WITH BURNED-IN ANNOTATIONS
        
        This function creates a new video file that has all the annotation bounding boxes
        permanently drawn on top of the original video frames. Think of it like taking
        a video and permanently drawing boxes and labels on it, then saving it as a new video.
        
        "Burned-in" means the annotations become part of the video pixels themselves,
        not separate overlay data. It's like the difference between:
        - A movie with optional subtitles (can be turned on/off)
        - A movie with subtitles permanently painted onto each frame
        
        This is useful for:
        1. Sharing annotated videos with people who don't have annotation software
        2. Creating demonstration videos that show what was detected/tracked
        3. Making training materials or presentations
        4. Archiving results where the annotations are part of the visual record
        
        The process:
        1. Create a virtual canvas for drawing each frame
        2. Set up video recording from the canvas
        3. For each frame: draw the original + annotations on canvas
        4. Let the video recorder capture each frame
        5. When done, save the recorded video file
      */
      function exportAnnotatedFramesAsVideo() {
        const totalFrames = framesManager.frames.totalFrames();
        
        /*
          SAFETY CHECK - ENSURE WE HAVE FRAMES TO EXPORT
          
          Don't proceed if there are no frames loaded. This prevents errors
          and gives the user a clear message about what's wrong.
        */
        if (totalFrames === 0) {
          alert('No frames available to export.');
          return;
        }

        /*
          SETUP PROGRESS DISPLAY AND DISABLE CONTROLS
          
          Show a progress bar and disable export buttons during processing.
          This prevents users from starting multiple exports simultaneously
          and gives visual feedback about the operation's progress.
        */
        exportProgressDiv.style.display = 'block';      // Show progress area
        exportVideoButton.disabled = true;              // Disable video export button
        exportAnnotatedZipButton.disabled = true;       // Disable ZIP export button
        exportProgressBar.value = 0;                    // Reset progress bar to 0%
        exportProgressText.textContent = '0%';          // Reset progress text

        /*
          SETUP CANVAS DIMENSIONS USING FIRST FRAME
          
          We need to know the video dimensions to create the output video.
          Get the first frame to determine the width and height that all
          frames should have.
        */
        annotatedObjectsTracker.getFrameWithObjects(0).then((firstFrameWithObjects) => {
          /*
            CREATE VIRTUAL CANVAS FOR VIDEO GENERATION
            
            This canvas exists only in memory (not visible on the page).
            Think of it like a digital easel where we'll paint each frame
            before the video recorder captures it.
            
            We set it to the same dimensions as the video frames so the
            output video will be the correct size.
          */
          const canvas = document.createElement('canvas');  // Create invisible canvas
          const ctx = canvas.getContext('2d');             // Get drawing context
          
          canvas.width = firstFrameWithObjects.img.width;   // Set canvas width to match video
          canvas.height = firstFrameWithObjects.img.height; // Set canvas height to match video

          /*
            SETUP VIDEO RECORDING FROM CANVAS
            
            Modern browsers can record video from a canvas element. We set up:
            1. A stream that captures the canvas content
            2. A MediaRecorder that converts the stream to video format
            3. Storage for the video data chunks as they're generated
            
            Think of it like pointing a camera at our digital easel and
            hitting record while we paint each frame.
          */
          const stream = canvas.captureStream();                            // Create video stream from canvas
          const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' }); // Create video recorder
          const chunks = [];                                                 // Array to store video data

          /*
            SETUP RECORDING EVENT HANDLERS
            
            Define what happens when the recorder generates data and when it finishes.
          */
          recorder.ondataavailable = (event) => {
            chunks.push(event.data); // Collect video data chunks as they're generated
          };

          recorder.onstop = () => {
            /*
              FINALIZE AND DOWNLOAD THE VIDEO
              
              When recording stops, combine all the data chunks into a complete
              video file and trigger a download to the user's computer.
            */
            const blob = new Blob(chunks, { type: 'video/webm' }); // Combine chunks into video file
            const url = URL.createObjectURL(blob);                 // Create download URL

            /*
              TRIGGER AUTOMATIC DOWNLOAD
              
              Create a temporary download link and automatically click it.
              This is the standard way to trigger file downloads from JavaScript.
            */
            const a = document.createElement('a'); // Create download link
            a.style.display = 'none';              // Make it invisible
            a.href = url;                         // Set download URL
            a.download = 'annotated-frames.webm';  // Set filename
            document.body.appendChild(a);          // Add to page (required for click)
            a.click();                             // Trigger download
            document.body.removeChild(a);          // Remove from page
            URL.revokeObjectURL(url);              // Clean up memory
            
            /*
              CLEANUP INTERFACE
              
              Hide the progress display and re-enable the export buttons
              so the user can export again if needed.
            */
            exportProgressDiv.style.display = 'none'; // Hide progress area
            exportVideoButton.disabled = false;       // Re-enable video export button
            exportAnnotatedZipButton.disabled = false; // Re-enable ZIP export button
          };

          recorder.start(); // Begin video recording

          /*
            FRAME PROCESSING FUNCTION - THE MAIN EXPORT LOOP
            
            This function processes each frame individually, drawing the original
            frame plus annotations onto the canvas, then moving to the next frame.
            
            It's designed as a recursive function that calls itself for the next
            frame after finishing the current one. This ensures frames are processed
            in order and gives the video recorder time to capture each frame.
          */
          const processFrame = (frameIndex) => {
            /*
              CHECK FOR COMPLETION
              
              If we've processed all frames, stop the video recorder.
              This will trigger the onstop event handler above.
            */
            if (frameIndex >= totalFrames) {
              recorder.stop(); // Stop recording (triggers download)
              return;
            }

            /*
              UPDATE PROGRESS DISPLAY
              
              Show the user how much of the export is complete.
              Calculate percentage and update both the progress bar and text.
            */
            const progress = Math.round((frameIndex / totalFrames) * 100);
            exportProgressBar.value = progress;
            exportProgressText.textContent = `${progress}% (${frameIndex}/${totalFrames})`;

            /*
              DRAW CURRENT FRAME WITH ANNOTATIONS
              
              Get the frame data with all its annotations and draw everything
              onto the canvas. This is the same drawing logic used for display,
              but now we're drawing to a canvas that gets recorded as video.
            */
            annotatedObjectsTracker.getFrameWithObjects(frameIndex).then((frameWithObjects) => {
              /*
                DRAW THE BASE FRAME
                
                First, draw the original video frame onto the canvas.
                This provides the background image.
              */
              ctx.drawImage(frameWithObjects.img, 0, 0);
              
              /*
                DRAW EACH ANNOTATION
                
                Go through all the annotated objects and draw their bounding
                boxes and labels if they're visible in this frame.
              */
              for (let i = 0; i < frameWithObjects.objects.length; i++) {
                let object = frameWithObjects.objects[i];
                let annotatedObject = object.annotatedObject;
                let annotatedFrame = object.annotatedFrame;
                
                if (annotatedFrame.isVisible() && annotatedFrame.bbox) {
                  let bbox = annotatedFrame.bbox;
                  
                  /*
                    SET ANNOTATION-SPECIFIC COLOR
                    
                    Use the annotation's custom color if available, otherwise default to red.
                  */
                  let annotationColor = annotatedObject.color || '#FF0000';
                  ctx.strokeStyle = annotationColor; // Use annotation's color for bounding box
                  ctx.lineWidth = 2;                 // 2-pixel thick lines
                  ctx.font = '16px Arial';           // Font for object labels
                  ctx.fillStyle = annotationColor;   // Use annotation's color for text
                  
                  /*
                    DRAW BOUNDING BOX RECTANGLE
                    
                    Draw the rectangular outline around the object.
                  */
                  ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
                  
                  /*
                    DRAW OBJECT LABEL
                    
                    If the object has a meaningful name (not the default "Name?"),
                    draw it above the bounding box for identification.
                  */
                  if (annotatedObject.name && annotatedObject.name !== 'Name?') {
                    ctx.fillText(annotatedObject.name, bbox.x, bbox.y - 5);
                  }
                }
              }
              
              /*
                PROCEED TO NEXT FRAME
                
                Wait a brief moment (100ms) then process the next frame.
                The delay ensures the video recorder has time to capture this frame
                before we overwrite the canvas with the next frame.
              */
              setTimeout(() => processFrame(frameIndex + 1), 100);
              
            }).catch((error) => {
              /*
                ERROR HANDLING
                
                If there's an error processing this frame, log it and skip to
                the next frame. This prevents one bad frame from stopping the
                entire export process.
              */
              console.error(`Error processing frame ${frameIndex}:`, error);
              setTimeout(() => processFrame(frameIndex + 1), 100); // Skip and continue
            });
          };

          processFrame(0); // Start processing from frame 0
          
        }).catch(() => {
          /*
            FIRST FRAME ERROR HANDLING
            
            If we can't get the first frame (to determine dimensions),
            show an error and clean up the interface.
          */
          alert('Failed to fetch the first frame.');
          exportProgressDiv.style.display = 'none';
          exportVideoButton.disabled = false;
          exportAnnotatedZipButton.disabled = false;
        });
      }

      /*
        EXPORT ANNOTATED FRAMES AS ZIP FUNCTION - THE FRAME COLLECTION EXPORTER
        
        This function creates a ZIP file containing individual image files, where each
        image is one frame from the video with annotations drawn on it. Think of it like
        taking every page of a flip-book, drawing annotations on each page, then putting
        all the pages in a folder to share.
        
        Unlike the video export (which creates one video file), this creates many individual
        image files. This is useful for:
        1. Frame-by-frame analysis where you need to examine individual frames
        2. Creating training datasets for machine learning (each frame is a separate example)
        3. Integration with other tools that work with image sequences
        4. Manual review where you want to scroll through images at your own pace
        5. Creating presentations where you need specific frames as slides
        
        The process:
        1. Create a ZIP file container
        2. For each frame: draw original + annotations on a canvas
        3. Convert the canvas to an image file
        4. Add the image to the ZIP with a sequential filename
        5. When all frames are processed, download the complete ZIP
      */
      function exportAnnotatedFramesAsZip() {
        const totalFrames = framesManager.frames.totalFrames();
        
        /*
          SAFETY CHECK - ENSURE WE HAVE FRAMES TO EXPORT
        */
        if (totalFrames === 0) {
          alert('No frames available to export.');
          return;
        }

        /*
          SETUP PROGRESS DISPLAY AND DISABLE CONTROLS
          
          Same as video export - show progress and prevent multiple simultaneous operations.
        */
        exportProgressDiv.style.display = 'block';      // Show progress area
        exportVideoButton.disabled = true;              // Disable video export button
        exportAnnotatedZipButton.disabled = true;       // Disable ZIP export button
        exportProgressBar.value = 0;                    // Reset progress bar
        exportProgressText.textContent = '0%';          // Reset progress text

        /*
          CREATE ZIP FILE CONTAINER
          
          JSZip is a library that creates ZIP files in the browser. Think of it
          like getting an empty folder that we'll fill with image files.
        */
        const zip = new JSZip();
        let processedFrames = 0; // Counter to track completion

        /*
          FRAME PROCESSING FUNCTION - THE MAIN EXPORT LOOP
          
          Similar to video export, but instead of recording video, we create
          individual image files and add them to a ZIP archive.
          
          This is designed as a recursive function to ensure frames are processed
          in order and to prevent overwhelming the browser with too many simultaneous
          operations.
        */
        const processFrame = (frameIndex) => {
          /*
            CHECK FOR COMPLETION
            
            If we've processed all frames, generate the final ZIP file and download it.
          */
          if (frameIndex >= totalFrames) {
            /*
              GENERATE AND DOWNLOAD ZIP FILE
              
              Convert all the image files we've collected into a single downloadable
              ZIP archive. This is done asynchronously since large ZIP files take
              time to generate.
            */
            exportProgressText.textContent = 'Generating zip file...'; // Update status message
            zip.generateAsync({type: 'blob'}).then((content) => {
              /*
                TRIGGER ZIP FILE DOWNLOAD
                
                Same download mechanism as video export, but for a ZIP file.
              */
              const url = URL.createObjectURL(content);         // Create download URL
              const a = document.createElement('a');            // Create download link
              a.style.display = 'none';                        // Make it invisible
              a.href = url;                                     // Set download URL
              a.download = 'annotated-frames.zip';             // Set filename
              document.body.appendChild(a);                    // Add to page
              a.click();                                        // Trigger download
              document.body.removeChild(a);                    // Remove from page
              URL.revokeObjectURL(url);                        // Clean up memory
              
              /*
                CLEANUP INTERFACE
                
                Hide progress and re-enable buttons for potential future exports.
              */
              exportProgressDiv.style.display = 'none';        // Hide progress area
              exportVideoButton.disabled = false;              // Re-enable video export button
              exportAnnotatedZipButton.disabled = false;       // Re-enable ZIP export button
            });
            return; // Exit the recursive function
          }

          /*
            UPDATE PROGRESS DISPLAY
            
            Show export progress to the user.
          */
          const progress = Math.round((frameIndex / totalFrames) * 100);
          exportProgressBar.value = progress;
          exportProgressText.textContent = `${progress}% (${frameIndex}/${totalFrames})`;

          /*
            PROCESS CURRENT FRAME
            
            Get the frame with annotations and draw everything onto a canvas,
            then convert to an image file for the ZIP.
          */
          annotatedObjectsTracker.getFrameWithObjects(frameIndex).then((frameWithObjects) => {
            /*
              CREATE TEMPORARY CANVAS FOR THIS FRAME
              
              Each frame gets its own canvas for drawing. This canvas exists only
              long enough to create one image file.
            */
            const canvas = document.createElement('canvas'); // Create temporary canvas
            const ctx = canvas.getContext('2d');            // Get drawing context
            
            // Set canvas size to match frame
            canvas.width = frameWithObjects.img.width;
            canvas.height = frameWithObjects.img.height;
            
            /*
              DRAW FRAME WITH ANNOTATIONS
              
              Same drawing process as video export - base frame plus annotations.
            */
            ctx.drawImage(frameWithObjects.img, 0, 0); // Draw base frame
            
            // Draw each annotation
            for (let i = 0; i < frameWithObjects.objects.length; i++) {
              let object = frameWithObjects.objects[i];
              let annotatedObject = object.annotatedObject;
              let annotatedFrame = object.annotatedFrame;
              
              if (annotatedFrame.isVisible() && annotatedFrame.bbox) {
                let bbox = annotatedFrame.bbox;
                
                // Set annotation-specific color
                let annotationColor = annotatedObject.color || '#FF0000';
                ctx.strokeStyle = annotationColor; // Use annotation's color for bounding box
                ctx.lineWidth = 2;                 // 2-pixel thick lines
                ctx.font = '16px Arial';           // Font for labels
                ctx.fillStyle = annotationColor;   // Use annotation's color for text
                
                // Draw bounding box rectangle
                ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
                
                // Draw object label if meaningful
                if (annotatedObject.name && annotatedObject.name !== 'Name?') {
                  ctx.fillText(annotatedObject.name, bbox.x, bbox.y - 5);
                }
              }
            }
            
            /*
              CONVERT CANVAS TO IMAGE FILE AND ADD TO ZIP
              
              The canvas.toBlob() method converts the drawn canvas into an image file
              (JPEG format with 90% quality). When the conversion is complete, we add
              the image to our ZIP archive with a sequential filename.
              
              Filename format: frame_000001.jpg, frame_000002.jpg, etc.
              The zero-padding ensures files sort correctly in file browsers.
            */
            canvas.toBlob((blob) => {
              // Create zero-padded filename (frame_000001.jpg, frame_000002.jpg, etc.)
              const frameFileName = `frame_${frameIndex.toString().padStart(6, '0')}.jpg`;
              zip.file(frameFileName, blob);  // Add image to ZIP archive
              processedFrames++;              // Increment completion counter
              
              /*
                PROCEED TO NEXT FRAME
                
                Shorter delay (10ms) than video export since we're not recording,
                just creating files. This makes ZIP export faster than video export.
              */
              setTimeout(() => processFrame(frameIndex + 1), 10);
            }, 'image/jpeg', 0.9); // JPEG format with 90% quality
            
          }).catch((error) => {
            /*
              ERROR HANDLING
              
              If there's an error processing this frame, log it and continue.
              Don't let one bad frame stop the entire export.
            */
            console.error(`Error processing frame ${frameIndex}:`, error);
            setTimeout(() => processFrame(frameIndex + 1), 10); // Skip and continue
          });
        };

        processFrame(0); // Start processing from frame 0
      }

      // Make key functions and variables globally accessible for annotation manager
      window.annotatedObjectsTracker = annotatedObjectsTracker;
      window.clearAnnotatedObject = clearAnnotatedObject;
      window.clearAllAnnotatedObjects = clearAllAnnotatedObjects;
      window.addAnnotatedObjectControls = addAnnotatedObjectControls;
      window.player = player;
      
      // Make integration functions globally accessible
      window.initializeVideoController = initializeVideoController;
      window.goToFrame = goToFrame;
      window.notifyVideoControllerFrameChange = notifyVideoControllerFrameChange;

      /*
        VIDEO CONTROLLER INTEGRATION
        Connect the video controller with the annotation system
      */
      function initializeVideoController(totalFrames, frameRate) {
        console.log('Initializing video controller integration:', totalFrames, frameRate);
        if (window.videoController) {
          window.videoController.initializeVideo(totalFrames, frameRate);
        }
      }

      function notifyVideoControllerFrameChange(frameNumber) {
        if (window.videoController) {
          window.videoController.notifyFrameChange(frameNumber);
        }
      }

      // Enhanced goToFrame function that actually changes the display
      function goToFrame(frameNumber) {
        console.log('goToFrame called with:', frameNumber);
        
        // Update global frame variable
        if (typeof currentFrame !== 'undefined') {
          currentFrame = frameNumber;
        }
        
        // Update existing jQuery slider if it exists
        if (typeof $ !== 'undefined' && $('#slider').length) {
          const slider = $('#slider');
          if (slider.slider) {
            slider.slider('value', frameNumber);
            // Trigger the slide event to update the display
            slider.trigger('slide', [null, { value: frameNumber }]);
          }
        }
        
        // Try to call the player's seek function
        if (typeof player !== 'undefined' && player.seek) {
          player.seek(frameNumber);
        }
        
        // Update canvas display if drawFrame function exists
        if (typeof drawFrame === 'function') {
          drawFrame(frameNumber);
        }
        
        // Update annotation visibility
        if (window.annotationManager) {
          window.annotationManager.currentFrameNumber = frameNumber;
          window.annotationManager.updateAnnotationVisibilityStates();
        }
        
        // Notify video controller
        notifyVideoControllerFrameChange(frameNumber);
        
        console.log('Frame updated to:', frameNumber);
      }

      // Hook into the existing ready function to initialize video controller
      const originalReady = typeof ready === 'function' ? ready : function() {};
      function ready() {
        console.log('Enhanced ready function called');
        
        // Call original ready function
        originalReady();
        
        // Initialize video controller when player is ready
        setTimeout(() => {
          // Try to get frame count from various sources
          let frameCount = 0;
          
          if (typeof frames !== 'undefined' && frames.length) {
            frameCount = frames.length;
          } else if (typeof framesManager !== 'undefined' && framesManager.frames) {
            frameCount = framesManager.frames.totalFrames();
          } else if (typeof $('#slider').slider === 'function') {
            frameCount = $('#slider').slider('option', 'max') + 1;
          } else if (typeof totalFrames !== 'undefined') {
            frameCount = totalFrames;
          }
          
          if (frameCount > 0) {
            console.log('Auto-initializing video controller with', frameCount, 'frames');
            initializeVideoController(frameCount, 30);
          }
        }, 1000);
      }

      // Hook into slider events to sync with video controller
      $(document).ready(function() {
        // Wait for slider to be created
        setTimeout(() => {
          const slider = $('#slider');
          if (slider.length && slider.slider) {
            console.log('Hooking into existing slider events');
            
            // Override the existing slide event
            const existingSlideHandler = slider.data('ui-slider');
            if (existingSlideHandler) {
              slider.off('slide').on('slide', function(event, ui) {
                console.log('Slider slide event:', ui.value);
                
                // Update video controller
                if (window.videoController) {
                  window.videoController.currentFrame = ui.value;
                  window.videoController.updateDisplay();
                }
                
                // Update annotation visibility
                if (window.annotationManager) {
                  window.annotationManager.currentFrameNumber = ui.value;
                  window.annotationManager.updateAnnotationVisibilityStates();
                }
              });
            }
          }
        }, 2000);
      });

      // Export functions globally
      window.initializeVideoController = initializeVideoController;
      window.goToFrame = goToFrame;
      window.notifyVideoControllerFrameChange = notifyVideoControllerFrameChange;
      window.ready = ready;