/*
  COMPATIBILITY.JS - THE UNIVERSAL TRANSLATOR
  
  This file is like having a universal translator that helps our application speak to
  different web browsers. Think of it like this: imagine you're organizing an international
  conference where people speak different languages (Chrome, Firefox, Safari, etc.).
  You need translators to make sure everyone understands each other.
  
  The Problem:
  Different web browsers implement the same features in slightly different ways, or
  some browsers might not support certain features at all. This creates a nightmare
  for developers because the same code might work perfectly in Chrome but fail completely
  in Firefox or Safari.
  
  The Solution:
  This file detects what browser features are available and provides a standardized
  way to use them. If a browser doesn't support something, it provides a "polyfill"
  (a backup implementation) that mimics the missing functionality.
  
  Real-world analogy: It's like having adapters for electrical outlets when traveling.
  Different countries have different plug shapes, but with the right adapter, your
  device works anywhere. This file provides those "adapters" for web browsers.
*/

/**
* this code is from all around the web :)
* if u want to put some credits u are welcome!
*/
/*
  COMPATIBILITY MODULE STRUCTURE
  
  This creates a "module" - think of it like a toolbox that contains various tools
  (functions) that solve browser compatibility problems. The structure uses something
  called an "IIFE" (Immediately Invoked Function Expression), which is like building
  a private workshop where you can create tools without cluttering up the global space.
  
  The pattern: var compatibility = (function() { ... })();
  
  Breaking this down:
  1. (function() { ... }) - Creates a function (like building a workshop)
  2. (); at the end - Immediately runs that function (like opening the workshop right away)
  3. var compatibility = - Stores whatever the function returns (like getting a toolbox from the workshop)
  
  This keeps all the internal work private while only exposing the final tools we want to share.
*/
var compatibility = (function() {
        /*
          INITIALIZATION VARIABLES
          
          These are like setting up the basic tools and workspace before we start building
          our compatibility solutions. Think of it like laying out your tools on a workbench
          before starting a project.
        */
        var lastTime = 0,        // Used for timing animations (like a stopwatch for smooth motion)
        isLittleEndian = true,   // Computer architecture detection (like checking if you read left-to-right or right-to-left)

        /*
          URL COMPATIBILITY LAYER
          
          Different browsers call the same feature by different names. It's like some people
          call it "soda," others call it "pop," and others call it "soft drink" - they all
          mean the same thing, but we need to figure out which term this browser uses.
          
          This creates one standard name (URL) that works regardless of what the browser calls it internally.
        */
        URL = window.URL || window.webkitURL, // Try the standard name first, then the WebKit version

        /*
          REQUEST ANIMATION FRAME - THE SMOOTH ANIMATION COORDINATOR
          
          This is one of the most important functions for creating smooth animations and video processing.
          Think of it like a metronome for a musician, or a conductor keeping an orchestra in time.
          
          What it does:
          Instead of saying "update the animation RIGHT NOW!" (which can cause jerky motion),
          this function says "update the animation when the browser is ready for the next frame."
          This typically happens 60 times per second, creating smooth motion.
          
          The Problem:
          Different browsers implemented this feature with different names:
          - Modern browsers: requestAnimationFrame
          - Older Chrome/Safari: webkitRequestAnimationFrame  
          - Older Firefox: mozRequestAnimationFrame
          - Older Opera: oRequestAnimationFrame
          - Older Internet Explorer: msRequestAnimationFrame
          
          It's like asking for "the bathroom" in different languages - same concept, different words.
        */
        requestAnimationFrame = function(callback, element) {
            /*
              THE COMPATIBILITY CASCADE
              
              This uses the "||" (OR) operator to try each possibility in order.
              Think of it like a restaurant menu where you try your first choice,
              and if they're out of that, you try your second choice, and so on.
              
              The browser will use the first function that exists and ignore the rest.
            */
            var requestAnimationFrame =
                window.requestAnimationFrame        ||  // Try the modern standard first
                window.webkitRequestAnimationFrame  ||  // Then try Chrome/Safari's old version
                window.mozRequestAnimationFrame     ||  // Then try Firefox's old version
                window.oRequestAnimationFrame       ||  // Then try Opera's old version
                window.msRequestAnimationFrame      ||  // Then try Internet Explorer's version
                function(callback, element) {
                    /*
                      FALLBACK IMPLEMENTATION - THE MANUAL METRONOME
                      
                      If none of the browser-provided functions exist (very old browsers),
                      we create our own timing system using setTimeout. This is like manually
                      counting beats if you don't have a metronome.
                      
                      We aim for 60 frames per second, which means each frame should happen
                      every 16.67 milliseconds (1000ms ÷ 60fps ≈ 16.67ms).
                    */
                    var currTime = new Date().getTime(); // Get the current time in milliseconds
                    
                    /*
                      Calculate how long to wait before the next frame.
                      We want frames every 16ms, so we subtract how much time has passed
                      since the last frame from 16ms. Math.max ensures we never get negative values.
                    */
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    
                    /*
                      Set up a timer to call the callback function after the calculated delay.
                      This creates our fake "requestAnimationFrame" using setTimeout.
                    */
                    var id = window.setTimeout(function() {
                        callback(currTime + timeToCall); // Call the animation function with the timestamp
                    }, timeToCall);
                    
                    lastTime = currTime + timeToCall; // Remember when this frame happened
                    return id; // Return the timer ID so it can be cancelled if needed
                };

            /*
              FUNCTION INVOCATION
              
              Call whichever requestAnimationFrame function we found (or created) above.
              The .call(window, callback, element) ensures the function runs with the
              correct context (like making sure a borrowed tool knows which workshop it's in).
            */
            return requestAnimationFrame.call(window, callback, element);
        },

        /*
          CANCEL ANIMATION FRAME - THE ANIMATION STOPPER
          
          This is the partner function to requestAnimationFrame. If requestAnimationFrame
          is like setting an alarm clock, then cancelAnimationFrame is like turning off
          that alarm before it goes off.
          
          Why do we need this?
          Sometimes you start an animation but then need to stop it (user clicks a different
          button, or the page is closing, etc.). Without this function, the animation would
          keep running in the background, wasting computer resources and potentially causing
          strange behavior.
          
          Like requestAnimationFrame, different browsers call this by different names.
        */
        cancelAnimationFrame = function(id) {
            /*
              Try to find the browser's built-in cancel function, or create our own fallback.
              The 'id' parameter is the timer ID that was returned by requestAnimationFrame.
            */
            var cancelAnimationFrame = window.cancelAnimationFrame || // Try the standard function
                                        function(id) {
                                            /*
                                              FALLBACK IMPLEMENTATION
                                              
                                              If the browser doesn't have cancelAnimationFrame,
                                              we fall back to clearTimeout. This works because
                                              our manual requestAnimationFrame implementation
                                              (above) uses setTimeout, so clearTimeout can cancel it.
                                              
                                              It's like using a universal remote when the original
                                              remote is lost - it might not have all the fancy
                                              buttons, but it can still turn the TV off.
                                            */
                                            clearTimeout(id);
                                        };
            /*
              Call the cancel function with the proper context, just like we did
              with requestAnimationFrame above.
            */
            return cancelAnimationFrame.call(window, id);
        },

        /*
          GET USER MEDIA - THE CAMERA AND MICROPHONE ACCESS CONTROLLER
          
          This function is like asking permission to use someone's camera or microphone.
          In the early days of web browsers, accessing the user's camera/microphone was
          a new and experimental feature, so different browsers implemented it differently.
          
          What it does:
          When a web application wants to access your camera (like for video chat or
          taking photos), it needs to ask the browser, which then asks you for permission.
          This function handles that request in a way that works across different browsers.
          
          Real-world analogy: It's like having different ways to knock on someone's door
          depending on the type of house - some have doorbells, some have door knockers,
          some you just knock with your hand. This function tries all the different
          "knocking methods" until one works.
          
          Important note: This is less relevant for our video annotation tool since we're
          working with uploaded video files, not live camera feeds, but it's included
          for completeness.
        */
        getUserMedia = function(options, success, error) {
            /*
              Try to find the browser's getUserMedia function using the compatibility cascade.
              Each browser used a different prefix (webkit, moz, ms) in the early days.
            */
            var getUserMedia =
                window.navigator.getUserMedia ||        // Try the standard location first
                window.navigator.mozGetUserMedia ||     // Firefox's version
                window.navigator.webkitGetUserMedia ||  // Chrome/Safari's version
                window.navigator.msGetUserMedia ||      // Internet Explorer's version
                function(options, success, error) {
                    /*
                      FALLBACK FOR UNSUPPORTED BROWSERS
                      
                      If the browser doesn't support getUserMedia at all (very old browsers),
                      we immediately call the error function. This is like politely saying
                      "Sorry, this door doesn't have a doorbell, and knocking isn't working either."
                      
                      The application can then handle this gracefully, maybe by showing a
                      message like "Your browser doesn't support camera access."
                    */
                    error();
                };

            /*
              Call the getUserMedia function we found. Note that this function belongs
              to navigator (the browser's information center), not the main window.
            */
            return getUserMedia.call(window.navigator, options, success, error);
        },

        /*
          ENDIAN DETECTION - THE BYTE ORDER DETECTIVE
          
          This is a very technical function that detects how the computer stores numbers
          in memory. Think of it like figuring out whether someone writes numbers from
          left-to-right or right-to-left.
          
          What is "Endian"?
          When computers store multi-byte numbers (like the number 1000), they need to
          decide which byte goes first in memory. There are two common ways:
          
          - Little Endian: Store the "little end" (least significant byte) first
          - Big Endian: Store the "big end" (most significant byte) first
          
          Real-world analogy: It's like different ways of writing dates:
          - American style: MM/DD/YYYY (month first - like "little endian" for dates)
          - European style: DD/MM/YYYY (day first - like "big endian" for dates)
          
          Why does this matter?
          When working with binary data (like image pixels or video frames), we need to
          know the byte order to interpret the data correctly. Getting this wrong would
          be like misreading 12/01/2023 as January 12th when it actually means December 1st.
          
          Most modern computers use Little Endian, but it's always good to check!
        */
        detectEndian = function() {
            /*
              Create a test to figure out the byte order. We'll create a small piece
              of memory and write a known pattern to it, then see how it's stored.
            */
            var buf = new ArrayBuffer(8);    // Create 8 bytes of memory (like a small notebook)
            var data = new Uint32Array(buf); // View this memory as 32-bit numbers
            
            /*
              Write a specific pattern: 0xff000000
              In binary: 11111111 00000000 00000000 00000000
              
              If the system is Little Endian, the first byte will be 0x00
              If the system is Big Endian, the first byte will be 0xff
            */
            data[0] = 0xff000000;
            
            /*
              Assume Little Endian by default (this is the most common case)
            */
            isLittleEndian = true;
            
            /*
              Check the first byte. If it's 0xff, then we're on a Big Endian system
              because the "big end" (0xff) was stored first.
            */
            if (buf[0] === 0xff) {
                isLittleEndian = false; // Actually Big Endian
            }
            
            return isLittleEndian; // Return the result
        };

    /*
      MODULE EXPORT - DELIVERING THE TOOLBOX
      
      This is where we package up all our compatibility tools and hand them over
      to the rest of the application. Think of it like organizing all your tools
      in a toolbox and then giving that toolbox to someone who needs to use them.
      
      We return an object (like a labeled toolbox) that contains all the functions
      we created above. The rest of the application can then use these tools by
      saying things like:
      - compatibility.requestAnimationFrame(myFunction)
      - compatibility.getUserMedia(options, success, error)
      - etc.
      
      This creates a clean, organized interface where the application doesn't need
      to worry about browser differences - it just uses our standardized tools.
    */
    return {
        URL: URL,                                    // Standardized URL creation function
        requestAnimationFrame: requestAnimationFrame, // Smooth animation timing
        cancelAnimationFrame: cancelAnimationFrame,   // Animation cancellation
        getUserMedia: getUserMedia,                   // Camera/microphone access
        detectEndian: detectEndian,                   // Byte order detection function
        isLittleEndian: isLittleEndian               // Current system's byte order (detected value)
    };
/*
  MODULE CLOSURE AND IMMEDIATE EXECUTION
  
  The })(); at the end closes our private workshop and immediately runs it.
  Everything inside the function stays private (like keeping your workshop organized),
  but the returned toolbox (compatibility object) becomes available to the outside world.
  
  This pattern is called a "Module Pattern" and it's like having a factory that:
  1. Sets up a private workspace
  2. Builds the tools in private
  3. Packages them nicely
  4. Delivers the finished toolbox
  5. Cleans up the workspace (it's no longer needed)
*/
})();