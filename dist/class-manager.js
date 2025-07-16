   /**
 * ANNOTATION CLASS MANAGEMENT SYSTEM
 * 
 * This module handles the creation, storage, and management of annotation classes
 * with unique colors. It allows users to dynamically create classes during runtime
 * and ensures the class information is included in all exports.
 */

// Global object to store annotation classes and their colors
let annotationClasses = {};

// Initialize with some default classes
const defaultClasses = {
    'cracks': '#FF0000',        // Red
    'spalling': '#00FF00',      // Green
    'corrosion': '#0000FF',     // Blue
    'general': '#FFFF00'        // Yellow
};

/**
 * Initialize the class management system
 */
function initializeClassManager() {
    // Load default classes
    Object.assign(annotationClasses, defaultClasses);
    
    // Set up event listeners
    setupClassManagerEventListeners();
    
    // Update UI with default classes
    updateClassDisplay();
    updateClassDropdown();
    
    // Set initial random color
    const colorInput = document.getElementById('newClassColor');
    if (colorInput) {
        colorInput.value = generateRandomColor();
    }
    
    console.log('Class manager initialized with default classes:', annotationClasses);
}

/**
 * Set up event listeners for class management UI elements
 */
function setupClassManagerEventListeners() {
    // Add class button
    const addClassButton = document.getElementById('addClassButton');
    if (addClassButton) {
        addClassButton.addEventListener('click', addNewClass);
    }
    
    // Class name input (Enter key support)
    const classNameInput = document.getElementById('newClassName');
    if (classNameInput) {
        classNameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addNewClass();
            }
        });
    }
    
    // Class selection dropdown
    const classDropdown = document.getElementById('annotationClass');
    if (classDropdown) {
        classDropdown.addEventListener('change', updateClassPreview);
    }
    
    // Color input
    const colorInput = document.getElementById('newClassColor');
    if (colorInput) {
        colorInput.addEventListener('change', function() {
            // Generate a random color if user wants variety
            // This is just visual feedback
        });
    }
}

/**
 * Add a new annotation class
 */
function addNewClass() {
    const classNameInput = document.getElementById('newClassName');
    const classColorInput = document.getElementById('newClassColor');
    
    if (!classNameInput || !classColorInput) {
        console.error('Class creation elements not found');
        return;
    }
    
    const className = classNameInput.value.trim().toLowerCase();
    const classColor = classColorInput.value;
    
    // Validation
    if (!className) {
        alert('Please enter a class name');
        classNameInput.focus();
        return;
    }
    
    if (annotationClasses.hasOwnProperty(className)) {
        alert(`Class "${className}" already exists. Please choose a different name.`);
        classNameInput.focus();
        return;
    }
    
    // Add the new class
    annotationClasses[className] = classColor;
    
    // Update UI
    updateClassDisplay();
    updateClassDropdown();
    
    // Notify annotation manager to refresh class dropdowns
    if (window.annotationManager && typeof window.annotationManager.refreshClassDropdowns === 'function') {
        window.annotationManager.refreshClassDropdowns();
    }
    
    // Clear inputs
    classNameInput.value = '';
    classColorInput.value = generateRandomColor();
    
    // Auto-select the newly created class
    const classDropdown = document.getElementById('annotationClass');
    if (classDropdown) {
        classDropdown.value = className;
        updateClassPreview();
    }
    
    console.log(`Added new class: ${className} with color ${classColor}`);
    alert(`Class "${className}" added successfully!`);
}

/**
 * Update the display of available classes
 */
function updateClassDisplay() {
    const classList = document.getElementById('classList');
    if (!classList) return;
    
    classList.innerHTML = '';
    
    Object.entries(annotationClasses).forEach(([className, color]) => {
        const listItem = document.createElement('li');
        listItem.style.marginBottom = '5px';
        listItem.style.padding = '5px';
        listItem.style.border = '1px solid #ddd';
        listItem.style.borderRadius = '3px';
        listItem.style.backgroundColor = '#fff';
        
        listItem.innerHTML = `
            <span style="display: inline-block; width: 20px; height: 20px; background-color: ${color}; border: 1px solid #000; margin-right: 10px; vertical-align: middle;"></span>
            <strong>${className}</strong> (${color})
            <button onclick="removeClass('${className}')" style="float: right; background: #ff4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">Remove</button>
        `;
        
        classList.appendChild(listItem);
    });
}

/**
 * Update the class selection dropdown
 */
function updateClassDropdown() {
    const classDropdown = document.getElementById('annotationClass');
    if (!classDropdown) return;
    
    const currentValue = classDropdown.value;
    classDropdown.innerHTML = '<option value="">Select a class</option>';
    
    Object.keys(annotationClasses).forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className.charAt(0).toUpperCase() + className.slice(1);
        classDropdown.appendChild(option);
    });
    
    // Restore previous selection if it still exists
    if (currentValue && annotationClasses.hasOwnProperty(currentValue)) {
        classDropdown.value = currentValue;
    }
    
    updateClassPreview();
}

/**
 * Update the color preview for the selected class
 */
function updateClassPreview() {
    const classDropdown = document.getElementById('annotationClass');
    const preview = document.getElementById('selectedClassPreview');
    
    if (!classDropdown || !preview) return;
    
    const selectedClass = classDropdown.value;
    if (selectedClass && annotationClasses[selectedClass]) {
        preview.style.backgroundColor = annotationClasses[selectedClass];
        preview.style.display = 'inline-block';
        preview.title = `${selectedClass} (${annotationClasses[selectedClass]})`;
    } else {
        preview.style.display = 'none';
    }
}

/**
 * Remove a class (with confirmation)
 */
function removeClass(className) {
    if (!annotationClasses.hasOwnProperty(className)) {
        return;
    }
    
    // Check if this class is being used by any annotations
    // Note: This would need to be integrated with the main annotation system
    const confirmMessage = `Are you sure you want to remove the class "${className}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        delete annotationClasses[className];
        updateClassDisplay();
        updateClassDropdown();
        console.log(`Removed class: ${className}`);
    }
}

/**
 * Get the currently selected annotation class
 */
function getCurrentAnnotationClass() {
    const classDropdown = document.getElementById('annotationClass');
    if (!classDropdown) return null;
    
    const selectedClass = classDropdown.value;
    if (!selectedClass) {
        alert('Please select an annotation class before creating annotations');
        return null;
    }
    
    return selectedClass;
}

/**
 * Get the color for a specific class
 */
function getClassColor(className) {
    return annotationClasses[className] || '#000000';
}

/**
 * Get all available classes
 */
function getAllClasses() {
    return { ...annotationClasses };
}

/**
 * Generate a random color for new classes
 */
function generateRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Export classes information for XML
 */
function exportClassesForXML() {
    let classesXML = '  <classes>\n';
    Object.entries(annotationClasses).forEach(([className, color]) => {
        classesXML += `    <class name="${className}" color="${color}" />\n`;
    });
    classesXML += '  </classes>\n';
    return classesXML;
}

/**
 * Import classes from XML
 */
function importClassesFromXML(xmlDoc) {
    try {
        const classElements = xmlDoc.getElementsByTagName('class');
        let importedCount = 0;
        
        for (let i = 0; i < classElements.length; i++) {
            const classElement = classElements[i];
            const className = classElement.getAttribute('name');
            const classColor = classElement.getAttribute('color');
            
            if (className && classColor) {
                annotationClasses[className] = classColor;
                importedCount++;
            }
        }
        
        if (importedCount > 0) {
            updateClassDisplay();
            updateClassDropdown();
            console.log(`Imported ${importedCount} classes from XML`);
        }
    } catch (error) {
        console.error('Error importing classes from XML:', error);
    }
}

/**
 * Reset classes to defaults
 */
function resetToDefaultClasses() {
    if (confirm('Are you sure you want to reset all classes to defaults? This will remove any custom classes you\'ve created.')) {
        annotationClasses = { ...defaultClasses };
        updateClassDisplay();
        updateClassDropdown();
        
        // Notify annotation manager to refresh class dropdowns
        if (window.annotationManager && typeof window.annotationManager.refreshClassDropdowns === 'function') {
            window.annotationManager.refreshClassDropdowns();
        }
        
        console.log('Classes reset to defaults');
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure other scripts are loaded
    setTimeout(initializeClassManager, 100);
});

// Make key functions and variables globally accessible
window.annotationClasses = annotationClasses;
window.getCurrentAnnotationClass = getCurrentAnnotationClass;
window.getClassColor = getClassColor;
window.getAllClasses = getAllClasses;
window.resetToDefaultClasses = resetToDefaultClasses;

// Make functions available globally for onclick handlers
window.removeClass = removeClass;
window.resetToDefaultClasses = resetToDefaultClasses;
