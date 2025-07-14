

        
              /* 
  FRAMEZ.JS - VIDEO ANNOTATION TOOL CORE ENGINE
  
  This file is like the brain of our video annotation application. Think of it like the engine
  of a car - it contains all the complex machinery that makes everything work, but users don't
  see it directly. They just interact with the steering wheel and pedals (the HTML interface).
  
  What this tool does:
  1. Takes a video file and breaks it into individual pictures (frames) - like taking apart a flip-book
  2. Lets users draw boxes around objects in those pictures
  3. Uses computer vision magic to automatically track those boxes as objects move between frames
  4. Saves all that work so users can download it or continue later
  
  Think of it like having a super-smart assistant that can:
  - Take screenshots of every moment in a video
  - Remember where you drew boxes around things
  - Predict where those things will be in the next frame
  - Keep track of everything so you don't lose your work
*/

// this is the main entry point for the application  
"use strict"; // This tells JavaScript to be extra careful about catching programming mistakes

          /*
            FRAMES MANAGER CLASS - THE VIDEO FRAME COORDINATOR
            
            Think of this class like a librarian who manages a collection of photos (video frames).
            The librarian keeps track of:
            - How many photos are in the collection
            - How to get any specific photo when someone asks for it
            - Who to notify when the collection changes (like getting a new set of photos)
            
            A "class" in programming is like a blueprint for creating objects. It's like having
            a cookie cutter - you can use it to make many cookies (objects) that all have the
            same shape but might have different decorations.
          */
          class FramesManager {
            constructor() {
              /*
                The constructor is like the "birth certificate" of an object - it sets up
                the initial state when a new FramesManager is created. Think of it like
                setting up a new filing cabinet with empty folders.
              */
              this.frames = {
                totalFrames: () => { return 0; } // Start with zero frames, like an empty photo album
              };
              this.onReset = []; // List of functions to call when we get new frames (like a notification list)
            }

            set(frames) {
              /*
                This method is like replacing all the photos in our album with a new set.
                When this happens, we need to tell everyone who was interested in the old photos
                that we now have new ones. It's like sending a group text saying "Hey, I got new photos!"
              */
              this.frames = frames; // Replace our current frame collection with the new one
              
              // Notify all interested parties that we have new frames
              for (let i = 0; i < this.onReset.length; i++) {
                this.onReset[i](); // Call each notification function in our list
              }
            }
          }

          /*
            BLOB TO IMAGE CONVERTER FUNCTION
            
            This function is like a photo developer in the old days. When you took film to be developed,
            they would take the raw film data and turn it into actual pictures you could look at.
            
            In our case, we have "blob" data (Binary Large Object - basically a chunk of file data)
            and we need to turn it into an actual image that can be displayed on screen.
            
            A "Promise" is like making a reservation at a restaurant - you don't get your table
            immediately, but you get a promise that you'll get it eventually. The function returns
            a promise because converting blob data takes time, and we don't want to freeze the
            entire application while waiting.
          */
          function blobToImage(blob) {
            return new Promise((result, _) => {
              /*
                Create a new Image object - think of this like getting a blank picture frame
                that we're going to put a photo into.
              */
              let img = new Image();
              
              /*
                Set up what happens when the image finishes loading. This is like saying
                "When the photo is fully developed and ready, do this..."
              */
              img.onload = function() {
                result(img); // Tell the Promise "We're done! Here's your image!"
                
                /*
                  Clean up the temporary URL we created. Think of this like throwing away
                  the negative after you've printed your photo - we don't need it anymore
                  and it takes up memory.
                */
                URL.revokeObjectURL(this.src);
              };
              
              /*
                Create a temporary URL from the blob data and tell the image to load from it.
                This is like creating a temporary address where the browser can find our image data.
              */
              img.src = URL.createObjectURL(blob);
            });
          }

          /**
           * VIDEO FRAME EXTRACTION FUNCTION - THE FRAME RIPPER
           * 
           * This is like having a super-fast camera operator who can watch a movie and take
           * a perfect screenshot of every single frame. Imagine watching a flip-book and
           * carefully removing each page to create a stack of individual pictures.
           * 
           * The function takes a video file and breaks it down into individual frames (pictures),
           * then stores each frame in a database so we can access them later.
           * 
           * Parameters:
           * - config: Settings that control how the extraction works (like quality, speed, etc.)
           * - file: The video file to extract frames from
           * - progress: A function to call with updates on how the extraction is going
           */
          function extractFramesFromVideo(config, file, progress) {
            /*
              Set up all our variables - think of this like laying out all your tools
              before starting a big project. We're preparing everything we'll need.
            */
            let resolve = null; // Function to call when we're completely done
            let db = null; // Database to store our extracted frames
            let video = document.createElement('video'); // Create an invisible video player
            let canvas = document.createElement('canvas'); // Create an invisible drawing surface
            let ctx = canvas.getContext('2d'); // Get the "paintbrush" for our canvas
            let dimensionsInitialized = false; // Have we figured out the video size yet?
            let totalFrames = 0; // How many frames we've found so far
            let processedFrames = 0; // How many frames we've successfully saved
            let lastApproxFrame = -1; // The last frame number we processed (to avoid duplicates)
            let lastProgressFrame = -1; // The last frame we reported progress for
            let attachmentName = 'img' + config.imageExtension; // What to name each frame file

            /*
              Return a Promise - this is like giving someone a receipt that says
              "Your order is being prepared, we'll call you when it's ready"
            */
            return new Promise((_resolve, _) => {
              resolve = _resolve; // Store the "call when ready" function

              /*
                Set up our database. We destroy any existing database first (like clearing
                out an old photo album) and then create a fresh one.
              */
              let dbName = 'vatic_js'; // Name of our database
              db = new PouchDB(dbName).destroy().then(() => {
                db = new PouchDB(dbName); // Create a fresh database

                /*
                  Configure our invisible video player. Think of this like setting up
                  a DVD player with specific settings before pressing play.
                */
                video.autoplay = false; // Don't start playing automatically
                video.muted = true; // No sound (we only care about the pictures)
                video.loop = false; // Don't repeat when it reaches the end
                video.playbackRate = config.playbackRate; // How fast to play (might be faster than normal)
                video.src = URL.createObjectURL(file); // Tell the video player what file to load
                
                /*
                  Start our frame-by-frame processing. This sets up a loop that will run
                  continuously, checking if there's a new frame to capture.
                */
                compatibility.requestAnimationFrame(onBrowserAnimationFrame);
                video.play(); // Start the video playing
              });
            });

            /*
              MAIN FRAME PROCESSING LOOP
              
              This function is like a security guard who checks every few milliseconds:
              "Is there a new frame ready? Should I take a screenshot?"
              
              It runs continuously while the video plays, capturing frames and saving them.
              Think of it like having a robot that sits next to a TV and takes a photo
              every time the picture changes.
            */
            function onBrowserAnimationFrame() {
              /*
                Check if we're done with the entire video. This is like checking if
                we've reached the end of our flip-book and all pages are saved.
              */
              if (dimensionsInitialized && video.ended) {
                if (processedFrames == totalFrames) {
                  videoEnded(); // We're completely done!
                }
                return; // Exit this function
              }

              /*
                Schedule this function to run again on the next animation frame.
                This creates a continuous loop - like setting an alarm that goes off
                60 times per second to check for new frames.
              */
              compatibility.requestAnimationFrame(onBrowserAnimationFrame);

              /*
                Check if the video has enough data loaded to show a frame.
                It's like checking if a streaming video has buffered enough to display the picture.
                If not, we'll try again on the next loop.
              */
              if (video.readyState !== video.HAVE_CURRENT_DATA &&
                  video.readyState !== video.HAVE_FUTURE_DATA &&
                  video.readyState !== video.HAVE_ENOUGH_DATA) {
                return; // Not ready yet, try again next time
              }

              /*
                Calculate which frame number we should be at based on the current time.
                This is like looking at a stopwatch and calculating "At 2.5 seconds into
                a 30fps video, we should be at frame 75"
              */
              let currentApproxFrame = Math.round(video.currentTime * config.fps);
              
              /*
                Only process if this is a new frame (avoid processing the same frame twice).
                It's like only taking a photo when the TV actually shows a new picture.
              */
              if (currentApproxFrame != lastApproxFrame) {
                lastApproxFrame = currentApproxFrame; // Remember this frame number
                let frameNumber = totalFrames; // Assign a sequential number to this frame
                totalFrames++; // Increment our frame counter

                /*
                  If this is our first frame, figure out the video dimensions and set up
                  our canvas to match. It's like measuring a picture before choosing a frame.
                */
                if (!dimensionsInitialized) {
                  dimensionsInitialized = true;
                  canvas.width = video.videoWidth; // Match the video's width
                  canvas.height = video.videoHeight; // Match the video's height
                }

                /*
                  Draw the current video frame onto our canvas. This is like taking a
                  screenshot of the video at this exact moment.
                */
                ctx.drawImage(video, 0, 0);
                
                /*
                  Convert the canvas drawing to a blob (file data) and save it to our database.
                  This is like taking our screenshot and saving it as a JPEG file.
                */
                canvas.toBlob(
                  (blob) => {
                    /*
                      Save this frame to our database with a unique ID.
                      It's like putting a photo in a filing cabinet with a label.
                    */
                    db.putAttachment(frameNumber.toString(), attachmentName, blob, config.imageMimeType).then((doc) => {
                      processedFrames++; // One more frame successfully saved!

                      /*
                        Report progress to the user (but not for every single frame,
                        as that would be too much information). It's like giving updates
                        every 10% instead of every single step.
                      */
                      if (frameNumber > lastProgressFrame) {
                        lastProgressFrame = frameNumber;
                        progress(video.currentTime / video.duration, processedFrames, blob);
                      }

                      /*
                        Check if we're completely done (video ended AND all frames saved).
                        This ensures we don't finish before all frames are actually saved to the database.
                      */
                      if (video.ended && processedFrames == totalFrames) {
                        videoEnded();
                      }
                    });
                  },
                  config.imageMimeType); // Specify what type of image file to create (JPEG, PNG, etc.)
              }
            }

            /*
              CLEANUP AND COMPLETION FUNCTION
              
              This function is called when we're completely done extracting all frames.
              It's like cleaning up your workspace after finishing a big project and
              delivering the final result.
            */
            function videoEnded() {
              /*
                Clean up the video resource. We check if there's still a source URL
                to avoid cleaning up twice (which could cause errors).
              */
              if (video.src != '') {
                URL.revokeObjectURL(video.src); // Free up memory used by the video URL
                video.src = ''; // Clear the video source

                /*
                  Return our final result - an object that provides access to all the frames
                  we extracted. This is like handing over a photo album with two capabilities:
                  1. Tell you how many photos are in it
                  2. Give you any specific photo when you ask for it by number
                */
                resolve({
                  totalFrames: () => { return totalFrames; }, // Function to get total frame count
                  getFrame: (frameNumber) => {
                    /*
                      Function to retrieve a specific frame from our database.
                      It's like asking "Can I see photo number 42?" and getting that exact photo.
                    */
                    return db.getAttachment(frameNumber.toString(), attachmentName);
                  }
                });
              }
            }
          }

          /**
           * ZIP FILE FRAME EXTRACTION FUNCTION - THE ARCHIVE UNPACKER
           * 
           * This function is like having a helper who can open a suitcase full of photos
           * that were previously packed up. Instead of extracting frames from a video,
           * this extracts frames from a ZIP file that was created in a previous session.
           * 
           * Think of it like this: Yesterday you took apart a flip-book and put all the
           * pages in a folder. Today you want to work with those pages again, so you
           * open the folder and organize them so you can use them.
           * 
           * Parameters:
           * - config: Settings for how to handle the images
           * - file: The ZIP file containing previously extracted frames
           */
          function extractFramesFromZip(config, file) {
            return new Promise((resolve, _) => {
              /*
                Use the JSZip library to open and read the ZIP file.
                This is like using a special tool to open a compressed folder.
              */
              JSZip
                .loadAsync(file) // Open the ZIP file (this takes time, so it's asynchronous)
                .then((zip) => {
                  /*
                    Count how many files are in the ZIP. Each file should be one frame.
                    This is like counting how many photos are in the folder.
                  */
                  let totalFrames = 0;
                  for (const file in zip.files) {
                    if (zip.files.hasOwnProperty(file)) { // Make sure this is actually a file in the ZIP
                      totalFrames++; // Count each file
                    }
                  }
                
                  /*
                    Return an object that provides access to the frames, just like
                    the video extraction function does. This gives the same interface
                    whether frames came from a video or a ZIP file.
                  */
                  resolve({
                    totalFrames: () => { return totalFrames; }, // Function to get total count
                    getFrame: (frameNumber) => {
                      /*
                        Function to get a specific frame from the ZIP file.
                        This is more complex than the database version because we need to
                        find the right file in the ZIP and convert it to the right format.
                      */
                      return new Promise((resolve, _) => {
                        /*
                          Safety check: make sure the requested frame number is valid.
                          It's like checking "Do we actually have a photo number 42?"
                        */
                        if (frameNumber < 0 || frameNumber > totalFrames) {
                          throw new Error(`Invalid frameNumber in getFrame(). frameNumber is ${frameNumber} but there are ${totalFrames}.`);
                        }
                        
                        /*
                          Find the file in the ZIP that corresponds to this frame number.
                          ZIP files don't guarantee order, so we use the frame number as an index
                          into the list of file names.
                        */
                        const key = Object.keys(zip.files)[frameNumber]; // Get the filename
                        const file = zip.files[key]; // Get the actual file object

                        /*
                          Extract the file data and convert it to a blob (the format our
                          application expects). This is like taking a photo out of an envelope
                          and making sure it's in the right format to display.
                        */
                        file
                          .async('arraybuffer') // Get the raw file data
                          .then((content) => {
                            /*
                              Create a blob from the raw data. A blob is like a container
                              that holds file data in a format the browser can work with.
                            */
                            let blob = new Blob([ content ], {type: config.imageMimeType});
                            resolve(blob); // Return the blob to whoever asked for this frame
                          });
                      });
                    }
                  });
                });
            });
          }

          /**
           * OPTICAL FLOW CLASS - THE MOTION TRACKER
           * 
           * This is like having a super-smart detective who can look at two photos taken
           * one second apart and figure out exactly how everything moved between them.
           * 
           * Imagine you have two pictures of a busy street - one taken at 3:00 PM and
           * another at 3:01 PM. This class can look at both pictures and tell you:
           * "The red car moved 15 pixels to the right, the person walking moved 8 pixels
           * down and 3 pixels left, etc."
           * 
           * This is crucial for our annotation tool because when a user draws a box around
           * a car in frame 1, we want to automatically predict where that car will be in
           * frame 2, so the user doesn't have to redraw the box every single time.
           */
          class OpticalFlow {
            constructor() {
              /*
                Set up the initial state. Think of this like preparing a detective's workspace
                with file folders for "previous case" and "current case"
              */
              this.isInitialized = false; // Have we processed our first frame yet?
              
              /*
                Create "image pyramids" - these are like having multiple versions of the same
                photo at different zoom levels. It's like having the same picture in sizes:
                giant poster, regular photo, and thumbnail. This helps the algorithm work
                better because it can track big movements in the small images and fine
                movements in the large images.
              */
              this.previousPyramid = new jsfeat.pyramid_t(3); // 3 levels of zoom
              this.currentPyramid = new jsfeat.pyramid_t(3);   // 3 levels of zoom
            }

            /*
              INITIALIZATION FUNCTION - SETTING UP THE DETECTIVE
              
              This prepares our optical flow algorithm with the first frame.
              It's like showing a detective the "before" photo so they can later
              compare it with the "after" photo.
            */
            init(imageData) {
              /*
                Allocate memory for our image pyramids based on the image size.
                This is like getting the right size folders for our photos.
                
                jsfeat.U8_t | jsfeat.C1_t means "8-bit unsigned integers, 1 channel"
                In simple terms: grayscale images where each pixel is a number from 0-255
              */
              this.previousPyramid.allocate(imageData.width, imageData.height, jsfeat.U8_t | jsfeat.C1_t);
              this.currentPyramid.allocate(imageData.width, imageData.height, jsfeat.U8_t | jsfeat.C1_t);
              
              /*
                Convert the color image to grayscale and store it in our previous pyramid.
                Optical flow works better with grayscale because it focuses on brightness
                patterns rather than colors. It's like a detective focusing on shapes and
                shadows rather than colors when tracking movement.
              */
              jsfeat.imgproc.grayscale(imageData.data, imageData.width, imageData.height, this.previousPyramid.data[0]);
              
              /*
                Build the pyramid (create the different zoom levels).
                This creates thumbnail and medium-sized versions of our image.
              */
              this.previousPyramid.build(this.previousPyramid.data[0]);
              
              this.isInitialized = true; // We're now ready to track motion!
            }

            /*
              RESET FUNCTION - STARTING FRESH
              
              This is like telling our detective "Forget everything you knew before,
              we're starting a completely new case." Used when we load a new video
              or jump to a different part of the video.
            */
            reset() {
              this.isInitialized = false;
            }

            /*
              MAIN TRACKING FUNCTION - THE MOTION DETECTOR
              
              This is where the magic happens! This function takes the current frame and
              a list of bounding boxes, then figures out where those boxes should be moved
              to match how objects have moved between frames.
              
              Think of it like this: You drew boxes around cars in yesterday's traffic photo.
              Today you have a new traffic photo from the same intersection. This function
              looks at both photos and says "The car that was in box 1 has moved here,
              the car in box 2 has moved there," etc.
            */
            track(imageData, bboxes) {
              /*
                Safety check: Make sure we've been initialized with a previous frame.
                It's like making sure the detective has seen the "before" photo before
                trying to compare it with the "after" photo.
              */
              if (!this.isInitialized) {
                throw 'not initialized';
              }

              /*
                Process the new frame: convert to grayscale and build the pyramid.
                This prepares our "after" photo for comparison.
              */
              jsfeat.imgproc.grayscale(imageData.data, imageData.width, imageData.height, this.currentPyramid.data[0]);
              this.currentPyramid.build(this.currentPyramid.data[0]);

              // TODO: Move all configuration to config
              let bboxBorderWidth = 1; // Small border around bounding boxes

              /*
                SET UP TRACKING POINTS
                
                Instead of tracking entire boxes, we track many small points within each box.
                Think of it like putting a grid of tiny sensors inside each box - if most
                of the sensors move in the same direction, we know the whole object moved
                that way.
                
                We use an 11x11 grid of points for each bounding box (121 points total per box).
                It's like putting 121 tiny GPS trackers inside each box to see how they move.
              */
              let pointsPerDimension = 11; // 11 points along each edge of the box
              let pointsPerObject = pointsPerDimension * pointsPerDimension; // 11x11 = 121 points per box
              let pointsCountUpperBound = bboxes.length * pointsPerObject; // Maximum possible points
              
              /*
                Create arrays to store our tracking data:
                - pointsStatus: Did each point track successfully? (1 = success, 0 = failed)
                - previousPoints: Where each point was in the previous frame
                - currentPoints: Where each point ended up in the current frame
              */
              let pointsStatus = new Uint8Array(pointsCountUpperBound);      // Success/failure for each point
              let previousPoints = new Float32Array(pointsCountUpperBound * 2); // X,Y coordinates in previous frame
              let currentPoints = new Float32Array(pointsCountUpperBound * 2);  // X,Y coordinates in current frame

              /*
                POPULATE TRACKING POINTS
                
                For each bounding box, create a grid of points evenly distributed within it.
                Think of it like placing thumbtacks in a grid pattern within each box.
              */
              let pointsCount = 0;
              for (let i = 0, n = 0; i < bboxes.length; i++) {
                let bbox = bboxes[i];
                if (bbox != null) { // Only process boxes that actually exist
                  /*
                    Create an 11x11 grid of points within this bounding box.
                    Each point is placed at a specific fraction of the box's width and height.
                  */
                  for (let x = 0; x < pointsPerDimension; x++) {
                    for (let y = 0; y < pointsPerDimension; y++) {
                      /*
                        Calculate the exact position of this point within the bounding box.
                        The formula spreads points evenly across the box from edge to edge.
                      */
                      previousPoints[pointsCount*2] = bbox.x + x * (bbox.width / (pointsPerDimension - 1));      // X coordinate
                      previousPoints[pointsCount*2 + 1] = bbox.y + y * (bbox.height / (pointsPerDimension - 1)); // Y coordinate
                      pointsCount++; // Count how many points we've created
                    }
                  }
                }
              }
              
              /*
                Safety check: Make sure we have at least some points to track.
                If there are no bounding boxes or all boxes are null, there's nothing to track.
              */
              if (pointsCount == 0) {
                throw 'no points to track';
              }

              /*
                RUN THE OPTICAL FLOW ALGORITHM
                
                This is the actual "magic" - the Lucas-Kanade optical flow algorithm.
                It analyzes the brightness patterns around each point in both frames
                and calculates where each point most likely moved to.
                
                The parameters (30, 30, 0.01, 0.001) are fine-tuning values that control
                how the algorithm works - like adjusting the sensitivity of our motion detector.
              */
              jsfeat.optical_flow_lk.track(
                this.previousPyramid,    // Previous frame (where points started)
                this.currentPyramid,     // Current frame (where points ended up)
                previousPoints,          // Starting positions of all points
                currentPoints,           // Where the algorithm thinks points moved to
                pointsCount,             // How many points we're tracking
                30,                      // Window size for analysis
                30,                      // Number of iterations
                pointsStatus,            // Output: which points were tracked successfully
                0.01,                    // Convergence threshold
                0.001                    // Minimum eigenvalue threshold
              );

              /*
                CALCULATE NEW BOUNDING BOX POSITIONS
                
                Now we have information about how individual points moved, but we need to
                figure out how to move entire bounding boxes. This is like having data
                about how 121 individual sensors moved, and using that to determine how
                the whole object moved.
              */
              let newBboxes = []; // Array to store the updated bounding box positions
              let p = 0; // Index to track which point we're currently processing
              
              /*
                Process each bounding box one at a time
              */
              for (let i = 0; i < bboxes.length; i++) {
                let bbox = bboxes[i]; // Get the original bounding box
                let newBbox = null;   // Start with no new position (will be calculated)

                if (bbox != null) {   // Only process boxes that actually exist
                  /*
                    Collect the movement data for all points that belong to this bounding box.
                    We separate the points into "before" and "after" positions, but only
                    include points that were successfully tracked.
                  */
                  let before = []; // Where points were in the previous frame
                  let after = [];  // Where points ended up in the current frame

                  /*
                    Go through all points for this bounding box (121 points in an 11x11 grid)
                  */
                  for (let j = 0; j < pointsPerObject; j++, p++) {
                    /*
                      Only use points that were successfully tracked. Some points might fail
                      if they moved out of frame or if the tracking algorithm lost them.
                    */
                    if (pointsStatus[p] == 1) { // 1 means "successfully tracked"
                      let x = p * 2;     // X coordinate index (points are stored as [x1,y1,x2,y2,...])
                      let y = x + 1;     // Y coordinate index

                      /*
                        Add this point's before/after positions to our collections
                      */
                      before.push([previousPoints[x], previousPoints[y]]); // Where it was
                      after.push([currentPoints[x], currentPoints[y]]);   // Where it went
                    }
                  }

                  /*
                    If we have at least some successfully tracked points, calculate the
                    overall movement of the bounding box.
                  */
                  if (before.length > 0) {
                    /*
                      Use the "nudged" library to calculate the best transformation that
                      maps the "before" points to the "after" points. We specify 'T' which
                      means "translation only" (just movement, no rotation or scaling).
                      
                      This is like saying "Look at all these point movements and figure out
                      the single direction and distance that best explains how they all moved."
                    */
                    let diff = nudged.estimate('T', before, after);
                    let translation = diff.getTranslation(); // Get the movement vector [deltaX, deltaY]

                    /*
                      Calculate the new bounding box position by applying the movement.
                      We also add safety checks to make sure the box doesn't go outside
                      the image boundaries.
                    */
                    let minX = Math.max(Math.round(bbox.x + translation[0]), 0); // New left edge (can't be negative)
                    let minY = Math.max(Math.round(bbox.y + translation[1]), 0); // New top edge (can't be negative)
                    let maxX = Math.min(Math.round(bbox.x + bbox.width + translation[0]), imageData.width - 2*bboxBorderWidth);   // New right edge
                    let maxY = Math.min(Math.round(bbox.y + bbox.height + translation[1]), imageData.height - 2*bboxBorderWidth); // New bottom edge
                    
                    /*
                      Calculate the new width and height based on the constrained edges
                    */
                    let newWidth = maxX - minX;
                    let newHeight = maxY - minY;

                    /*
                      Only create a new bounding box if it has positive width and height.
                      If the object moved completely out of frame, we'll get zero or negative
                      dimensions, which means we should mark this object as invisible.
                    */
                    if (newWidth > 0 && newHeight > 0) {
                      newBbox = new BoundingBox(minX, minY, newWidth, newHeight);
                    }
                  }
                }

                /*
                  Add the new bounding box (or null if tracking failed) to our results.
                  This maintains the same order as the input bboxes array.
                */
                newBboxes.push(newBbox);
              }

              /*
                PREPARE FOR NEXT FRAME
                
                Swap the pyramids so that what was "current" becomes "previous" for the next
                tracking operation. This is like moving today's photo to the "yesterday" folder
                and getting ready for tomorrow's photo.
                
                We reuse the old pyramid object to save memory - it's like reusing a folder
                instead of creating a new one each time.
              */
              let oldPyramid = this.previousPyramid;
              this.previousPyramid = this.currentPyramid; // Current becomes previous
              this.currentPyramid = oldPyramid;           // Reuse the old previous as new current

              return newBboxes; // Return the updated bounding box positions
            }
          };

          /**
           * BOUNDING BOX CLASS - THE RECTANGLE CONTAINER
           * 
           * This is a simple class that represents a rectangular box drawn around an object.
           * Think of it like a picture frame or a highlighter rectangle that marks where
           * an object is located in an image.
           * 
           * It stores four numbers that completely describe a rectangle:
           * - x: How far from the left edge of the image (like "5 inches from the left")
           * - y: How far from the top edge of the image (like "3 inches from the top")
           * - width: How wide the rectangle is (like "the frame is 4 inches wide")
           * - height: How tall the rectangle is (like "the frame is 6 inches tall")
           * 
           * With these four numbers, you can draw the exact same rectangle anywhere!
           */
          class BoundingBox {
            constructor(x, y, width, height) {
              this.x = x;           // Left edge position
              this.y = y;           // Top edge position  
              this.width = width;   // How wide the box is
              this.height = height; // How tall the box is
            }
          }

          /**
           * ANNOTATED FRAME CLASS - THE PHOTO WITH NOTES
           * 
           * This class represents a single frame (image) from a video along with information
           * about what's in that frame. Think of it like a photo with a sticky note attached
           * that says "There's a car at this location in this picture."
           * 
           * Each AnnotatedFrame contains:
           * - frameNumber: Which frame this is (like "photo #42 out of 1000")
           * - bbox: Where the object is in this frame (the rectangular box around it)
           * - isGroundTruth: Did a human draw this box, or did the computer guess it?
           * 
           * The "isGroundTruth" concept is important: 
           * - Ground truth = A human carefully drew this box (very accurate)
           * - Not ground truth = The computer predicted this box using optical flow (good guess, but might be wrong)
           */
          class AnnotatedFrame {
            constructor(frameNumber, bbox, isGroundTruth) {
              this.frameNumber = frameNumber;     // Which frame number this annotation belongs to
              this.bbox = bbox;                   // The bounding box (can be null if object is not visible)
              this.isGroundTruth = isGroundTruth; // True if human-drawn, false if computer-predicted
            }

            /*
              VISIBILITY CHECK FUNCTION
              
              This is a helper function that answers the question "Can we see the object in this frame?"
              An object is visible if it has a bounding box. If bbox is null, it means the object
              is not visible in this frame (maybe it went off-screen or behind something).
              
              Think of it like asking "Is there a sticky note on this photo?" If yes, the object
              is visible. If no sticky note, the object is not visible in this frame.
            */
            isVisible() {
              return this.bbox != null; // null means "not visible", anything else means "visible"
            }
          }

          /**
           * ANNOTATED OBJECT CLASS - THE COMPLETE OBJECT STORY
           * 
           * This class represents one object (like "the red car" or "the walking person")
           * throughout the entire video. Think of it like a photo album dedicated to just
           * one person - it contains pictures of that person from different events, but
           * they're all organized together.
           * 
           * An AnnotatedObject contains a collection of AnnotatedFrames, each showing where
           * that specific object was in different frames of the video. So if you're tracking
           * a car through a 100-frame video, this object might contain 100 AnnotatedFrames
           * showing the car's position in each frame.
           * 
           * The frames array is kept sorted by frame number, like organizing photos by date.
           */
          class AnnotatedObject {
            constructor() {
              this.frames = []; // Array of AnnotatedFrame objects, sorted by frame number
            }

            /*
              ADD FRAME FUNCTION - ADDING A NEW PHOTO TO THE ALBUM
              
              This function adds a new AnnotatedFrame to this object's collection.
              It's smart about where to put it and handles several tricky situations:
              
              1. If the frame already exists, replace it (like updating a photo)
              2. Insert frames in the right order (keep the album organized by date)
              3. Remove computer-predicted frames that need to be recalculated
              4. Make sure there's always a frame at the beginning (frame 0)
            */
            add(frame) {
              /*
                Search through existing frames to find where this new frame should go.
                We want to keep frames sorted by frame number.
              */
              for (let i = 0; i < this.frames.length; i++) {
                /*
                  Case 1: We found a frame with the same frame number.
                  Replace the existing frame with the new one and clean up any
                  computer-predicted frames that come after it.
                */
                if (this.frames[i].frameNumber == frame.frameNumber) {
                  this.frames[i] = frame; // Replace the existing frame
                  this.removeFramesToBeRecomputedFrom(i + 1); // Clean up predictions after this frame
                  return; // We're done
                } 
                /*
                  Case 2: We found where the new frame should be inserted.
                  Insert it here and clean up any predictions that come after it.
                */
                else if (this.frames[i].frameNumber > frame.frameNumber) {
                  this.frames.splice(i, 0, frame); // Insert the frame at position i
                  this.removeFramesToBeRecomputedFrom(i + 1); // Clean up predictions after this frame
                  this.injectInvisibleFrameAtOrigin(); // Make sure we have a frame 0
                  return; // We're done
                }
              }

              /*
                Case 3: The new frame has a higher frame number than all existing frames.
                Add it to the end of the array.
              */
              this.frames.push(frame);
              this.injectInvisibleFrameAtOrigin(); // Make sure we have a frame 0
            }

            /*
              GET FRAME FUNCTION - FINDING A SPECIFIC PHOTO
              
              This function looks through the frames array to find the frame with a
              specific frame number. It's like looking through a photo album to find
              "the photo from day 15 of our vacation."
              
              Returns the AnnotatedFrame if found, or null if not found.
            */
            get(frameNumber) {
              /*
                Search through all frames in order. Since they're sorted by frame number,
                we can stop searching as soon as we pass the target frame number.
              */
              for (let i = 0; i < this.frames.length; i++) {
                let currentFrame = this.frames[i];
                
                /*
                  If we've gone past the target frame number, it means the frame
                  doesn't exist in our collection.
                */
                if (currentFrame.frameNumber > frameNumber) {
                  break; // Stop searching
                }

                /*
                  Found the exact frame we were looking for!
                */
                if (currentFrame.frameNumber == frameNumber) {
                  return currentFrame;
                }
              }

              return null; // Frame not found
            }

            /*
              CLEANUP FUNCTION - REMOVING OUTDATED COMPUTER PREDICTIONS
              
              When a human draws a new bounding box, any computer-predicted boxes that come
              after it become invalid and need to be removed. This is because the computer's
              predictions were based on the old human input, not the new one.
              
              Think of it like this: You're giving directions to a friend, and halfway through
              you realize you made a mistake in step 3. You need to throw away all the steps
              that came after the mistake and recalculate them based on the corrected step 3.
              
              This function removes all non-ground-truth frames starting from a given position
              until it hits either the end of the array or another ground-truth frame.
            */
            removeFramesToBeRecomputedFrom(frameNumber) {
              let count = 0; // Count how many frames to remove
              
              /*
                Look at frames starting from frameNumber and count how many consecutive
                non-ground-truth frames there are.
              */
              for (let i = frameNumber; i < this.frames.length; i++) {
                if (this.frames[i].isGroundTruth) {
                  break; // Stop when we hit a human-drawn frame
                }
                count++; // This frame needs to be removed
              }
              
              /*
                Remove the outdated computer-predicted frames.
                splice(start, count) removes 'count' elements starting at position 'start'
              */
              if (count > 0) {
                this.frames.splice(frameNumber, count);
              }
            }

            /*
              ORIGIN FRAME INJECTION - ENSURING A STARTING POINT
              
              This function ensures that every object has a frame at position 0 (the very
              beginning of the video). If the first human annotation was at frame 50,
              we still need to know where the object was at frame 0 (even if it wasn't visible).
              
              This is like making sure every story has a clear beginning, even if the
              interesting part doesn't start until later. We add an "invisible" frame
              at the beginning that says "this object wasn't visible yet."
            */
            injectInvisibleFrameAtOrigin() {
              /*
                Check if we need to add a frame at position 0:
                - If there are no frames at all, OR
                - If the first frame is not at position 0
              */
              if (this.frames.length == 0 || this.frames[0].frameNumber > 0) {
                /*
                  Insert an invisible frame at the beginning.
                  new AnnotatedFrame(0, null, false) means:
                  - Frame number 0
                  - No bounding box (null = invisible)
                  - Not ground truth (computer-generated default)
                */
                this.frames.splice(0, 0, new AnnotatedFrame(0, null, false));
              }
            }
          }

          /**
           * ANNOTATED OBJECTS TRACKER CLASS - THE MASTER COORDINATOR
           * 
           * This is like having a super-smart film director who can keep track of multiple
           * actors (objects) throughout an entire movie (video). The director knows:
           * - Where each actor is in each scene (frame)
           * - How to predict where actors will be in upcoming scenes
           * - How to fill in missing information when an actor moves between scenes
           * 
           * This class coordinates all the different parts:
           * - Manages multiple AnnotatedObjects (like managing multiple actors)
           * - Uses OpticalFlow to predict movements
           * - Provides frames with all objects positioned correctly
           */
          class AnnotatedObjectsTracker {
            constructor(framesManager) {
              /*
                Set up the tracker with connections to other parts of the system
              */
              this.framesManager = framesManager;   // Connection to the frame storage system
              this.annotatedObjects = [];          // List of all objects we're tracking
              this.opticalFlow = new OpticalFlow(); // The motion detection system
              this.lastFrame = -1;                 // Keep track of which frame we processed last
              this.ctx = document.createElement('canvas').getContext('2d'); // Canvas for image processing

              /*
                Register a callback to reset our tracker when new frames are loaded.
                This is like telling the director "When we start filming a new movie,
                forget everything about the previous movie and start fresh."
              */
              this.framesManager.onReset.push(() => {
                this.annotatedObjects = []; // Clear all tracked objects
                this.lastFrame = -1;        // Reset frame tracking
              });
            }

            /*
              GET FRAME WITH OBJECTS - THE MAIN DELIVERY FUNCTION
              
              This is the main function that other parts of the application call when they
              want to see a specific frame with all the objects positioned correctly.
              
              It's like asking the director: "Can you show me what scene 42 looks like,
              with all the actors in their correct positions?"
              
              The function handles the complex logic of:
              1. Finding a good starting point (a frame where we know all object positions)
              2. Using optical flow to track objects from that starting point to the target frame
              3. Returning the final result with the image and all object positions
            */
            getFrameWithObjects(frameNumber) {
              return new Promise((resolve, _) => {
                /*
                  Find the best starting frame for tracking. We need a frame where we
                  have reliable position data for all objects (either human-annotated
                  or previously computed).
                */
                let i = this.startFrame(frameNumber);

                /*
                  TRACKING LOOP FUNCTION
                  
                  This inner function creates a loop that tracks objects frame by frame
                  from the starting frame to the target frame. It's like following
                  the actors scene by scene until we reach the scene we want.
                */
                let trackNextFrame = () => {
                  /*
                    Track objects for frame 'i' (this includes optical flow calculations
                    if needed, or just retrieval of existing data if it's already known)
                  */
                  this.track(i).then((frameWithObjects) => {
                    /*
                      Check if we've reached our target frame
                    */
                    if (i == frameNumber) {
                      resolve(frameWithObjects); // We're done! Return the result
                    } else {
                      /*
                        Not there yet - move to the next frame and continue tracking
                      */
                      i++;
                      trackNextFrame(); // Recursive call to continue the loop
                    }
                  });
                };

                trackNextFrame(); // Start the tracking loop
              });
            }

            /*
              START FRAME FINDER - FINDING A RELIABLE STARTING POINT
              
              This function works backwards from the target frame to find a frame where
              we have reliable position data for ALL tracked objects. It's like working
              backwards through a story to find the last point where we knew where
              everyone was located.
              
              Why do we need this? Because optical flow tracking works by comparing
              consecutive frames. If we want to know where objects are in frame 50,
              but we only have human annotations for frames 10 and 60, we need to
              start tracking from frame 10 and work our way up to frame 50.
            */
            startFrame(frameNumber) {
              /*
                Work backwards from the target frame, checking each frame to see if
                we have position data for all objects.
              */
              for (; frameNumber >= 0; frameNumber--) {
                let allObjectsHaveData = true; // Assume we have data for all objects

                /*
                  Check each tracked object to see if it has data for this frame
                */
                for (let i = 0; i < this.annotatedObjects.length; i++) {
                  let annotatedObject = this.annotatedObjects[i];
                  if (annotatedObject.get(frameNumber) == null) {
                    allObjectsHaveData = false; // Found an object with missing data
                    break; // No need to check the rest
                  }
                }

                /*
                  If all objects have data for this frame, this is our starting point!
                */
                if (allObjectsHaveData) {
                  return frameNumber;
                }
              }

              /*
                If we get here, it means we couldn't find a frame where all objects
                have data. This shouldn't happen in a properly functioning system.
              */
              throw 'corrupted object annotations';
            }

            /*
              TRACK FUNCTION - THE CORE TRACKING LOGIC
              
              This function handles the tracking for a single frame. It determines what
              needs to be computed versus what can be retrieved from existing data,
              and coordinates the optical flow calculations when needed.
              
              Think of it like a director preparing for one specific scene:
              1. Check which actors already know their positions
              2. For actors who don't know their positions, calculate where they should be
              3. Combine all the position information and return the complete scene
            */
            track(frameNumber) {
              return new Promise((resolve, _) => {
                /*
                  Get the actual image data for this frame. We need the image to:
                  1. Display it to the user
                  2. Run optical flow calculations (if needed)
                */
                this.framesManager.frames.getFrame(frameNumber).then((blob) => {
                  blobToImage(blob).then((img) => {
                    /*
                      Separate objects into two categories:
                      1. Objects that already have position data for this frame
                      2. Objects that need their positions calculated using optical flow
                    */
                    let result = [];    // Objects with known positions
                    let toCompute = []; // Objects that need position calculations
                    
                    for (let i = 0; i < this.annotatedObjects.length; i++) {
                      let annotatedObject = this.annotatedObjects[i];
                      let annotatedFrame = annotatedObject.get(frameNumber);
                      
                      if (annotatedFrame == null) {
                        /*
                          This object doesn't have data for the current frame.
                          Get its position from the previous frame so we can track it forward.
                        */
                        annotatedFrame = annotatedObject.get(frameNumber - 1);
                        if (annotatedFrame == null) {
                          /*
                            This shouldn't happen if startFrame() worked correctly.
                            We should always have data for the previous frame.
                          */
                          throw 'tracking must be done sequentially';
                        }
                        toCompute.push({annotatedObject: annotatedObject, bbox: annotatedFrame.bbox});
                      } else {
                        /*
                          This object already has position data for this frame
                          (probably from a human annotation or previous calculation).
                        */
                        result.push({annotatedObject: annotatedObject, annotatedFrame: annotatedFrame});
                      }
                    }

                    /*
                      Extract just the bounding boxes from objects that need computation.
                      This creates an array like [bbox1, bbox2, bbox3] that we can
                      pass to the optical flow algorithm.
                    */
                    let bboxes = toCompute.map(c => c.bbox);
                    let hasAnyBbox = bboxes.some(bbox => bbox != null); // Do we have any visible objects to track?
                    
                    /*
                      Prepare the optical flow system if we have objects to track.
                      If all objects are invisible (bbox = null), we can skip optical flow.
                    */
                    let optionalOpticalFlowInit;
                    if (hasAnyBbox) {
                      optionalOpticalFlowInit = this.initOpticalFlow(frameNumber - 1);
                    } else {
                      optionalOpticalFlowInit = new Promise((r, _) => { r(); }); // Do nothing
                    }

                    /*
                      Wait for optical flow initialization to complete, then run the tracking
                    */
                    optionalOpticalFlowInit.then(() => {
                      let newBboxes; // Array to store the updated bounding box positions
                      
                      if (hasAnyBbox) {
                        /*
                          We have visible objects to track. Run optical flow to calculate
                          their new positions.
                        */
                        let imageData = this.imageData(img); // Convert image to format needed by optical flow
                        newBboxes = this.opticalFlow.track(imageData, bboxes); // Run the tracking algorithm
                        this.lastFrame = frameNumber; // Remember which frame we just processed
                      } else {
                        /*
                          No visible objects to track. Just use the existing bboxes
                          (which should all be null, meaning invisible).
                        */
                        newBboxes = bboxes;
                      }

                      /*
                        Create new AnnotatedFrame objects for all the computed positions
                        and add them to the appropriate AnnotatedObject collections.
                      */
                      for (let i = 0; i < toCompute.length; i++) {
                        let annotatedObject = toCompute[i].annotatedObject;
                        /*
                          Create a new AnnotatedFrame with:
                          - frameNumber: the current frame
                          - newBboxes[i]: the calculated position (or null if not visible)
                          - false: this is not ground truth (it's a computer calculation)
                        */
                        let annotatedFrame = new AnnotatedFrame(frameNumber, newBboxes[i], false);
                        annotatedObject.add(annotatedFrame); // Add this frame to the object's history
                        result.push({annotatedObject: annotatedObject, annotatedFrame: annotatedFrame});
                      }

                      /*
                        Return the complete result: the image plus all object positions
                        This gives the caller everything they need to display the frame
                        with all objects properly positioned.
                      */
                      resolve({img: img, objects: result});
                    });
                  });
                });
              });
            }

            /*
              OPTICAL FLOW INITIALIZATION - PREPARING THE MOTION DETECTOR
              
              This function prepares the optical flow system to track motion from a specific frame.
              The optical flow algorithm needs to compare two consecutive frames, so it needs
              to be "primed" with the previous frame before it can calculate motion to the current frame.
              
              Think of it like loading a "before" photo into a motion detector so it can compare
              it with an "after" photo and calculate how things moved.
            */
            initOpticalFlow(frameNumber) {
              return new Promise((resolve, _) => {
                /*
                  Optimization: If we just processed this exact frame, we don't need to
                  reload it. The optical flow system already has this frame in memory.
                */
                if (this.lastFrame != -1 && this.lastFrame == frameNumber) {
                  resolve(); // Already initialized for this frame
                } else {
                  /*
                    We need to load a new frame for optical flow initialization.
                    Reset the optical flow system and load the specified frame.
                  */
                  this.opticalFlow.reset(); // Clear any previous data
                  
                  /*
                    Load the frame image and initialize the optical flow system with it
                  */
                  this.framesManager.frames.getFrame(frameNumber).then((blob) => {
                    blobToImage(blob).then((img) => {
                      let imageData = this.imageData(img); // Convert to the format optical flow needs
                      this.opticalFlow.init(imageData);    // Initialize optical flow with this image
                      this.lastFrame = frameNumber;        // Remember which frame we loaded
                      resolve(); // Initialization complete
                    });
                  });
                }
              });
            }

            /*
              IMAGE DATA CONVERTER - PREPARING IMAGES FOR COMPUTER VISION
              
              This function converts an Image object (which is good for displaying to users)
              into ImageData (which is good for computer vision algorithms). 
              
              Think of it like converting a photo from "display format" (nice to look at)
              to "analysis format" (easy for computers to process pixel by pixel).
              
              The computer vision algorithms need access to the raw pixel data - the exact
              red, green, and blue values for every single pixel in the image.
            */
            imageData(img) {
              /*
                Set up a canvas that matches the image size. The canvas is like a
                temporary workspace where we can draw the image and then extract
                the pixel data.
              */
              let canvas = this.ctx.canvas;
              canvas.width = img.width;   // Make canvas the same width as the image
              canvas.height = img.height; // Make canvas the same height as the image
              
              /*
                Draw the image onto the canvas. This is like printing a photo
                onto a special paper that lets us read the color values.
              */
              this.ctx.drawImage(img, 0, 0);
              
              /*
                Extract the pixel data from the canvas. This gives us an array
                containing the red, green, blue, and transparency values for
                every single pixel in the image.
                
                The result is an ImageData object that computer vision algorithms
                can work with directly.
              */
              return this.ctx.getImageData(0, 0, canvas.width, canvas.height);
            }
          };

      

