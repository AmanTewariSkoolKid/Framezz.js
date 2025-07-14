/*
  ANNOTATION-MANAGER.JS - INDIVIDUAL ANNOTATION UI MANAGEMENT
  
  This file manages the individual annotation cards that show detailed information
  for each annotation created by the user. Think of it like a detailed inventory
  system where each annotation gets its own information card.
  
  Features:
  - Creates dynamic annotation cards with class-colored borders
  - Manages visibility controls (is visible, hidden checkboxes)
  - Handles annotation comments and metadata
  - Provides bulk actions for multiple annotations
  - Integrates with the existing annotation system
*/

"use strict";

/*
  ANNOTATION MANAGER CLASS
  This class handles all the UI operations for individual annotations
*/
class AnnotationManager {
  constructor() {
    this.annotations = new Map(); // Map to store annotation data by ID
    this.annotationIdCounter = 1; // Counter for generating unique annotation IDs
    this.currentFrameNumber = 0; // Track current video frame
    
    // Get references to DOM elements
    this.annotationsList = document.getElementById('annotationsList');
    this.noAnnotationsMessage = document.getElementById('noAnnotationsMessage');
    
    // Initialize the manager
    this.initialize();
  }
  
  /*
    INITIALIZATION
    Set up event listeners and initial state
  */
  initialize() {
    // Hide the "no annotations" message initially
    this.updateNoAnnotationsMessage();
    
    // Set up periodic updates to sync visibility with video playback
    setInterval(() => {
      this.updateAnnotationVisibilityStates();
    }, 100); // Check every 100ms
  }
  
  /*
    CREATE ANNOTATION CARD
    Creates a new annotation card when an annotation is added
  */
  createAnnotationCard(annotatedObject, classInfo) {
    const annotationId = this.annotationIdCounter++;
    const classColor = classInfo ? classInfo.color : '#FF0000';
    const className = classInfo ? classInfo.name : 'Unknown';
    
    // Store annotation data
    const annotationData = {
      id: annotationId,
      annotatedObject: annotatedObject,
      classInfo: classInfo,
      comments: '',
      isVisible: true,
      isHidden: false,
      createdFrame: this.currentFrameNumber
    };
    
    this.annotations.set(annotationId, annotationData);
    
    // Create the HTML for the annotation card
    const cardHtml = this.generateAnnotationCardHtml(annotationData);
    
    // Add the card to the container
    const cardElement = document.createElement('div');
    cardElement.innerHTML = cardHtml;
    cardElement.classList.add('annotation-card');
    cardElement.style.borderColor = classColor;
    cardElement.setAttribute('data-annotation-id', annotationId);
    
    this.annotationsList.appendChild(cardElement);
    
    // Set up event listeners for this card
    this.setupCardEventListeners(cardElement, annotationData);
    
    // Update the no annotations message
    this.updateNoAnnotationsMessage();
    
    return annotationId;
  }
  
  /*
    GENERATE ANNOTATION CARD HTML
    Creates the HTML structure for an annotation card
  */
  generateAnnotationCardHtml(annotationData) {
    const { id, classInfo, comments, isVisible, isHidden } = annotationData;
    const classColor = classInfo ? classInfo.color : '#FF0000';
    const className = classInfo ? classInfo.name : 'Unknown';
    
    return `
      <div class="annotation-header">
        <div class="annotation-id">ID: ${id}</div>
        <div class="annotation-class">
          <span class="class-color-indicator" style="background-color: ${classColor};"></span>
          <span>${className}</span>
        </div>
      </div>
      
      <div class="annotation-details">
        <div class="annotation-field">
          <label>Class:</label>
          <select class="class-selector" data-annotation-id="${id}">
            ${this.generateClassOptions(classInfo)}
          </select>
        </div>
        
        <div class="annotation-field">
          <label>Type:</label>
          <input type="text" class="annotation-type" placeholder="e.g., Vehicle, Person" value="${annotationData.type || ''}" data-annotation-id="${id}">
        </div>
        
        <div class="annotation-field" style="grid-column: 1 / -1;">
          <label>Comments:</label>
          <textarea class="annotation-comments" placeholder="Add notes about this annotation..." data-annotation-id="${id}">${comments}</textarea>
        </div>
      </div>
      
      <div class="annotation-controls">
        <div class="visibility-controls">
          <label>
            <input type="checkbox" class="is-visible-checkbox" ${isVisible ? 'checked' : ''} data-annotation-id="${id}">
            Is Visible
          </label>
          <label>
            <input type="checkbox" class="is-hidden-checkbox" ${isHidden ? 'checked' : ''} data-annotation-id="${id}">
            Hidden
          </label>
        </div>
        
        <div class="annotation-actions">
          <button class="edit-btn" data-annotation-id="${id}">Edit</button>
          <button class="focus-btn" data-annotation-id="${id}">Focus</button>
          <button class="delete-btn" data-annotation-id="${id}">Delete</button>
        </div>
      </div>
    `;
  }
  
  /*
    GENERATE CLASS OPTIONS
    Creates option elements for the class selector dropdown
  */
  generateClassOptions(selectedClass) {
    let options = '<option value="">Select a class</option>';
    
    // Get available classes from the global annotation classes
    if (typeof window.annotationClasses !== 'undefined') {
      Object.keys(window.annotationClasses).forEach(className => {
        const classColor = window.annotationClasses[className];
        const selected = selectedClass && selectedClass.name === className ? 'selected' : '';
        options += `<option value="${className}" data-color="${classColor}" ${selected}>${className}</option>`;
      });
    }
    
    return options;
  }
  
  /*
    SETUP CARD EVENT LISTENERS
    Adds event listeners to all interactive elements in an annotation card
  */
  setupCardEventListeners(cardElement, annotationData) {
    const annotationId = annotationData.id;
    
    // Class selector change
    const classSelector = cardElement.querySelector('.class-selector');
    classSelector.addEventListener('change', (e) => {
      this.handleClassChange(annotationId, e.target);
    });
    
    // Type field change
    const typeField = cardElement.querySelector('.annotation-type');
    typeField.addEventListener('change', (e) => {
      annotationData.type = e.target.value;
    });
    
    // Comments change
    const commentsField = cardElement.querySelector('.annotation-comments');
    commentsField.addEventListener('change', (e) => {
      annotationData.comments = e.target.value;
    });
    
    // Visibility checkboxes
    const visibleCheckbox = cardElement.querySelector('.is-visible-checkbox');
    visibleCheckbox.addEventListener('change', (e) => {
      this.handleVisibilityChange(annotationId, e.target.checked, 'visible');
    });
    
    const hiddenCheckbox = cardElement.querySelector('.is-hidden-checkbox');
    hiddenCheckbox.addEventListener('change', (e) => {
      this.handleVisibilityChange(annotationId, e.target.checked, 'hidden');
    });
    
    // Action buttons
    const editBtn = cardElement.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
      this.handleEditAnnotation(annotationId);
    });
    
    const focusBtn = cardElement.querySelector('.focus-btn');
    focusBtn.addEventListener('click', () => {
      this.handleFocusAnnotation(annotationId);
    });
    
    const deleteBtn = cardElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      this.handleDeleteAnnotation(annotationId);
    });
  }
  
  /*
    HANDLE CLASS CHANGE
    Updates annotation when class is changed
  */
  handleClassChange(annotationId, selectElement) {
    const annotationData = this.annotations.get(annotationId);
    const selectedOption = selectElement.selectedOptions[0];
    
    if (selectedOption && selectedOption.value) {
      const newClassInfo = {
        name: selectedOption.value,
        color: selectedOption.getAttribute('data-color')
      };
      
      annotationData.classInfo = newClassInfo;
      
      // Update the actual annotation object's class and color
      if (annotationData.annotatedObject) {
        annotationData.annotatedObject.className = newClassInfo.name;
        annotationData.annotatedObject.color = newClassInfo.color;
        
        // Update the visual bounding box color in the video
        if (annotationData.annotatedObject.dom) {
          annotationData.annotatedObject.dom.style.borderColor = newClassInfo.color;
        }
      }
      
      // Update the card's border color
      const cardElement = document.querySelector(`[data-annotation-id="${annotationId}"]`);
      cardElement.style.borderColor = newClassInfo.color;
      
      // Update the class color indicator
      const colorIndicator = cardElement.querySelector('.class-color-indicator');
      colorIndicator.style.backgroundColor = newClassInfo.color;
      
      // Update the class name display
      const classNameSpan = cardElement.querySelector('.annotation-class span:last-child');
      classNameSpan.textContent = newClassInfo.name;
    }
  }
  
  /*
    HANDLE VISIBILITY CHANGE
    Manages the visibility checkboxes and their effects
  */
  handleVisibilityChange(annotationId, checked, type) {
    const annotationData = this.annotations.get(annotationId);
    const cardElement = document.querySelector(`[data-annotation-id="${annotationId}"]`);
    
    if (type === 'visible') {
      annotationData.isVisible = checked;
      
      // Update the actual annotation visibility in the video
      if (annotationData.annotatedObject && annotationData.annotatedObject.dom) {
        annotationData.annotatedObject.dom.style.display = checked ? 'block' : 'none';
      }
      
    } else if (type === 'hidden') {
      annotationData.isHidden = checked;
      
      // Apply visual effects to the card
      if (checked) {
        cardElement.classList.add('hidden');
      } else {
        cardElement.classList.remove('hidden');
      }
      
      // Hide/show the actual annotation in the video
      if (annotationData.annotatedObject && annotationData.annotatedObject.dom) {
        annotationData.annotatedObject.dom.style.display = checked ? 'none' : 'block';
      }
    }
  }
  
  /*
    HANDLE EDIT ANNOTATION
    Allows editing of annotation properties
  */
  handleEditAnnotation(annotationId) {
    const annotationData = this.annotations.get(annotationId);
    // TODO: Implement edit functionality (could open a modal or enable inline editing)
    console.log('Editing annotation:', annotationData);
  }
  
  /*
    HANDLE FOCUS ANNOTATION
    Focuses the video on the frame where this annotation appears
  */
  handleFocusAnnotation(annotationId) {
    const annotationData = this.annotations.get(annotationId);
    // TODO: Jump to the frame where this annotation was created and highlight it
    console.log('Focusing on annotation:', annotationData);
    
    // If there's a slider control, jump to the annotation's frame
    if (typeof slider !== 'undefined' && slider.slider) {
      slider.slider('value', annotationData.createdFrame);
    }
  }
  
  /*
    HANDLE DELETE ANNOTATION
    Removes an annotation and its card
  */
  handleDeleteAnnotation(annotationId) {
    if (confirm('Are you sure you want to delete this annotation?')) {
      const annotationData = this.annotations.get(annotationId);
      console.log('Deleting annotation:', annotationId, annotationData);
      
      // Remove the actual annotation from the video system
      if (annotationData.annotatedObject && typeof window.annotatedObjectsTracker !== 'undefined') {
        // Find the index of this annotation in the tracker
        const index = window.annotatedObjectsTracker.annotatedObjects.findIndex(
          obj => obj === annotationData.annotatedObject
        );
        
        console.log('Found annotation at index:', index);
        console.log('Total annotations before deletion:', window.annotatedObjectsTracker.annotatedObjects.length);
        
        if (index !== -1) {
          // Use the existing clearAnnotatedObject function to properly remove it
          if (typeof window.clearAnnotatedObject === 'function') {
            console.log('Using clearAnnotatedObject function');
            window.clearAnnotatedObject(index);
            console.log('Total annotations after deletion:', window.annotatedObjectsTracker.annotatedObjects.length);
          } else {
            console.log('clearAnnotatedObject not available, using manual cleanup');
            // Manual cleanup fallback
            const annotatedObject = annotationData.annotatedObject;
            
            try {
              // Remove UI controls if they exist
              if (annotatedObject.controls) {
                console.log('Removing controls:', annotatedObject.controls);
                if (typeof annotatedObject.controls.remove === 'function') {
                  annotatedObject.controls.remove();
                } else if (annotatedObject.controls.parentNode) {
                  annotatedObject.controls.parentNode.removeChild(annotatedObject.controls);
                }
              }
              
              // Remove visual bounding box
              if (annotatedObject.dom) {
                console.log('Removing DOM element:', annotatedObject.dom);
                if (typeof $ !== 'undefined') {
                  $(annotatedObject.dom).remove();
                } else if (annotatedObject.dom.parentNode) {
                  annotatedObject.dom.parentNode.removeChild(annotatedObject.dom);
                }
              }
              
              // Remove from tracker array
              console.log('Removing from tracker array at index:', index);
              window.annotatedObjectsTracker.annotatedObjects.splice(index, 1);
              console.log('Total annotations after manual deletion:', window.annotatedObjectsTracker.annotatedObjects.length);
              
            } catch (error) {
              console.error('Error during manual annotation deletion:', error);
            }
          }
        } else {
          console.warn('Could not find annotation in tracker array');
        }
      }
      
      // Remove from our local storage
      this.annotations.delete(annotationId);
      console.log('Remaining annotations in manager:', this.annotations.size);
      
      // Remove the card from DOM
      const cardElement = document.querySelector(`[data-annotation-id="${annotationId}"]`);
      if (cardElement) {
        cardElement.remove();
        console.log('Removed annotation card from DOM');
      }
      
      // Update the no annotations message
      this.updateNoAnnotationsMessage();
      
      console.log('Annotation deletion complete');
    }
  }
  
  /*
    UPDATE NO ANNOTATIONS MESSAGE
    Shows/hides the "no annotations" message based on current annotations
  */
  updateNoAnnotationsMessage() {
    if (this.annotations.size === 0) {
      this.noAnnotationsMessage.style.display = 'block';
    } else {
      this.noAnnotationsMessage.style.display = 'none';
    }
  }
  
  /*
    UPDATE ANNOTATION VISIBILITY STATES
    Periodically checks and updates the visibility states based on current frame
  */
  updateAnnotationVisibilityStates() {
    // TODO: Implement logic to check which annotations should be visible in the current frame
    // This would integrate with the existing annotation tracking system
  }
  
  /*
    SET CURRENT FRAME
    Updates the current frame number for tracking purposes
  */
  setCurrentFrame(frameNumber) {
    this.currentFrameNumber = frameNumber;
  }
  
  /*
    REFRESH CLASS DROPDOWNS
    Updates all class dropdowns when new classes are added
  */
  refreshClassDropdowns() {
    // Update all class selector dropdowns in existing annotation cards
    const classSelectors = document.querySelectorAll('.class-selector');
    classSelectors.forEach(selector => {
      const currentValue = selector.value;
      selector.innerHTML = this.generateClassOptions({ name: currentValue });
      selector.value = currentValue; // Restore the selected value
    });
  }
  
  /*
    REFRESH OBJECTS DISPLAY
    Forces a refresh of the objects panel to show current annotations
  */
  refreshObjectsDisplay() {
    // Clear the objects panel
    const objectsPanel = document.getElementById('objects');
    if (objectsPanel) {
      objectsPanel.innerHTML = '';
    }
    
    // Recreate the control panels for all remaining annotations
    if (window.annotatedObjectsTracker && window.annotatedObjectsTracker.annotatedObjects) {
      window.annotatedObjectsTracker.annotatedObjects.forEach((annotatedObject) => {
        if (typeof window.addAnnotatedObjectControls === 'function') {
          window.addAnnotatedObjectControls(annotatedObject);
        }
      });
    }
  }
}

/*
  BULK ACTIONS
  Global functions for managing multiple annotations at once
*/

function toggleAllAnnotationsVisibility(visible) {
  console.log('Toggling all annotations visibility to:', visible);
  
  if (window.annotationManager) {
    // Update our annotation manager's annotations
    window.annotationManager.annotations.forEach((annotationData, id) => {
      annotationData.isVisible = visible;
      
      // Update the actual annotation visibility in the video
      if (annotationData.annotatedObject && annotationData.annotatedObject.dom) {
        annotationData.annotatedObject.dom.style.display = visible ? 'block' : 'none';
      }
      
      // Update the checkbox
      const checkbox = document.querySelector(`[data-annotation-id="${id}"] .is-visible-checkbox`);
      if (checkbox) {
        checkbox.checked = visible;
      }
    });
    
    // Also update any annotations that might exist in the global tracker but not in our manager
    if (window.annotatedObjectsTracker && window.annotatedObjectsTracker.annotatedObjects) {
      window.annotatedObjectsTracker.annotatedObjects.forEach(annotatedObject => {
        if (annotatedObject.dom) {
          annotatedObject.dom.style.display = visible ? 'block' : 'none';
        }
      });
    }
  }
}

function deleteAllAnnotations() {
  if (confirm('Are you sure you want to delete ALL annotations? This cannot be undone.')) {
    console.log('Starting delete all annotations...');
    
    if (window.annotationManager) {
      // First, use the global clearAllAnnotatedObjects function if available
      if (typeof window.clearAllAnnotatedObjects === 'function') {
        console.log('Using clearAllAnnotatedObjects function');
        window.clearAllAnnotatedObjects();
      } else {
        // Fallback: manually clear each annotation
        console.log('Manual cleanup of all annotations');
        
        if (window.annotatedObjectsTracker && window.annotatedObjectsTracker.annotatedObjects) {
          // Create a copy of the array since we'll be modifying it
          const annotationsToDelete = [...window.annotatedObjectsTracker.annotatedObjects];
          
          annotationsToDelete.forEach((annotatedObject, index) => {
            try {
              // Remove UI controls if they exist
              if (annotatedObject.controls) {
                console.log('Removing controls for annotation', index);
                if (typeof annotatedObject.controls.remove === 'function') {
                  annotatedObject.controls.remove();
                } else if (annotatedObject.controls.parentNode) {
                  annotatedObject.controls.parentNode.removeChild(annotatedObject.controls);
                }
              }
              
              // Remove visual bounding box
              if (annotatedObject.dom) {
                console.log('Removing DOM element for annotation', index);
                if (typeof $ !== 'undefined') {
                  $(annotatedObject.dom).remove();
                } else if (annotatedObject.dom.parentNode) {
                  annotatedObject.dom.parentNode.removeChild(annotatedObject.dom);
                }
              }
            } catch (error) {
              console.error('Error removing annotation', index, error);
            }
          });
          
          // Clear the entire array
          window.annotatedObjectsTracker.annotatedObjects.length = 0;
        }
      }
      
      // Clear the objects panel manually
      const objectsPanel = document.getElementById('objects');
      if (objectsPanel) {
        console.log('Clearing objects panel');
        objectsPanel.innerHTML = '';
      }
      
      // Clear all annotations from our manager
      console.log('Clearing annotation manager storage');
      window.annotationManager.annotations.clear();
      
      // Remove all annotation cards
      const cards = document.querySelectorAll('.annotation-card');
      console.log('Removing', cards.length, 'annotation cards');
      cards.forEach(card => card.remove());
      
      // Update message
      window.annotationManager.updateNoAnnotationsMessage();
      
      console.log('Delete all annotations complete');
    }
  }
}

// Initialize the annotation manager when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.annotationManager = new AnnotationManager();
  
  // Hook into existing annotation creation (this would need to be integrated with annotate.js)
  // This is a placeholder - actual integration would depend on how annotations are currently created
  window.createAnnotationCard = function(annotatedObject, classInfo) {
    return window.annotationManager.createAnnotationCard(annotatedObject, classInfo);
  };
});
