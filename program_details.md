# framez.js - A Pure JavaScript Video Annotation Tool

## Overview
framez.js is a browser-based video annotation tool designed to simplify the process of annotating videos. It allows users to draw bounding boxes around objects in video frames, track their movements using optical flow, and export annotations in XML format. The tool is lightweight, requiring no installation, and works seamlessly in modern browsers like Chrome and Firefox.

### Why Use framez.js?
Video annotation is a critical step in training machine learning models for tasks like object detection and tracking. framez.js provides an intuitive interface for creating high-quality annotations without requiring specialized software or hardware. Its browser-based design ensures accessibility and ease of use for both beginners and professionals.

## Key Features
- **Browser-Based:** Annotate videos directly in the browser without installing additional software.
- **Optical Flow Tracking:** Automatically track annotations across frames using advanced computer vision algorithms.
- **Export Options:** Save annotations in XML format, as annotated videos, or as individual frames with bounding boxes.
- **Bulk Actions:** Perform actions like deleting all annotations or toggling visibility for multiple annotations at once.
- **Customizable Classes:** Create and manage annotation classes with unique colors to categorize objects effectively.
- **Keyboard Shortcuts:** Streamline the annotation process with intuitive shortcuts.
- **Playback Controls:** Navigate through video frames with precision using playback controls.
- **Zoom Functionality:** Zoom in and out for detailed annotation work.

## Full Workflow

### Step 1: Load Video
Users start by selecting a video file to annotate. Supported formats include MP4, AVI, and other common video types. The tool ensures compatibility with modern browsers and provides a seamless file input interface.

### Step 2: Extract Frames
The video is broken down into individual frames using an invisible video player and canvas. Each frame is stored in a local database for quick access. This step ensures precise control over object tracking and alignment with the video timeline.

### Step 3: Annotate
Annotations are created by drawing bounding boxes on the video canvas. Users can:
- Select an annotation class from a dropdown menu.
- Add comments and metadata to each annotation.
- Use keyboard shortcuts for efficient annotation creation.
- Adjust bounding boxes pixel by pixel for precision.

### Step 4: Track
Optical flow algorithms predict the movement of objects between frames, reducing the need for manual annotation. This feature is particularly useful for videos with consistent object motion. Users can:
- Enable automatic tracking for annotations.
- Manually adjust tracking results if needed.

### Step 5: Manage Annotations
Annotations are displayed in a dedicated panel with detailed controls. Users can:
- Toggle visibility for individual annotations.
- Edit annotation properties like class and comments.
- Delete annotations individually or in bulk.
- Focus on specific annotations to jump to their corresponding frames.

### Step 6: Export
Annotations can be exported in multiple formats:
- **XML:** Structured data format for integration with machine learning pipelines.
- **Annotated Video:** Video with bounding boxes drawn on frames, useful for presentations or visual analysis.
- **Annotated Frames:** Individual frames with bounding boxes, ideal for training datasets.

### Step 7: Playback and Review
Users can review their annotations using playback controls. Features include:
- Play/pause functionality.
- Frame-by-frame navigation.
- Speed adjustment for playback.
- Progress slider for quick navigation.

## Full Functionalities

### Annotation Classes
Annotation classes are used to categorize objects in the video. Each class has a unique name and color, which helps in visually distinguishing between different types of objects. Examples include:
- **Cracks:** Red color for identifying structural cracks.
- **Spalling:** Green color for areas of material loss.
- **Corrosion:** Blue color for rust or other forms of corrosion.

#### Creating Classes
Users can create new classes using the class management interface. The process involves:
- Entering a class name.
- Selecting a color for the class.
- Adding the class to the global list.

#### Managing Classes
Users can:
- Edit class names and colors.
- Delete classes that are no longer needed.
- Reset classes to default values.

### Annotation Properties
Each annotation includes the following properties:
- **Bounding Box Coordinates:** Specifies the position and size of the annotation.
- **Class:** The category of the object being annotated.
- **Comments:** Additional notes or metadata about the annotation.
- **Visibility State:** Indicates whether the annotation is visible or hidden.
- **Frame Number:** The frame in which the annotation was created.

### Deleting Annotations
Annotations can be deleted individually or in bulk. The deletion process involves:
- Removing the annotation from the tracker.
- Deleting the corresponding bounding box and card from the DOM.
- Updating the annotation manager to reflect the changes.

### XML File Structure
Annotations are exported in XML format, which includes:
- **Classes Section:** Lists all annotation classes with their names and colors.
- **Annotations Section:** Contains detailed information about each annotation, including:
  - Bounding box coordinates.
  - Class name.
  - Frame number.
  - Comments.

#### Example XML Output
```xml
<annotations>
  <classes>
    <class name="cracks" color="#FF0000" />
    <class name="spalling" color="#00FF00" />
    <class name="corrosion" color="#0000FF" />
  </classes>
  <annotation>
    <frame number="1">
      <boundingBox x="100" y="150" width="50" height="50" />
      <class name="cracks" />
      <comments>Visible crack near the edge</comments>
    </frame>
  </annotation>
</annotations>
```

### Bulk Actions
Perform actions on multiple annotations at once, such as:
- Deleting all annotations.
- Toggling visibility for all annotations.
- Resetting annotations to their default state.

### Playback Controls
Navigate through video frames with precision using:
- Play/pause buttons.
- Frame skip buttons for moving forward or backward.
- Speed adjustment for playback.
- Progress slider for quick navigation.

### Zoom Functionality
Zoom in and out for detailed annotation work. This feature is particularly useful for annotating small or intricate objects.

### Export Options
Export annotations in multiple formats:
- **XML:** Structured data format for annotations.
- **Annotated Video:** Video with bounding boxes drawn on frames.
- **Annotated Frames:** Individual frames with bounding boxes.

### Keyboard Shortcuts
Streamline the annotation process with intuitive shortcuts:
- **n:** Create a new bounding box.
- **Spacebar:** Play/pause the video.
- **Arrow Keys:** Navigate frame by frame.
- **Delete:** Remove the selected annotation.
- **Shift + Arrow Keys:** Move bounding boxes pixel by pixel for precise adjustments.

### Customization
Users can customize:
- Annotation classes and colors.
- Playback speed.
- Zoom levels.
- Export settings.

## Browser Compatibility
framez.js works best in Chrome and Firefox. It uses modern web technologies like HTML5, JavaScript, and CSS. Compatibility layers ensure functionality in older browsers.

## Conclusion
framez.js is a powerful yet simple tool for video annotation. Its browser-based approach makes it accessible and easy to use, while its advanced features like optical flow and class management provide flexibility for professional workflows. Whether you're a researcher, developer, or hobbyist, framez.js is designed to meet your annotation needs efficiently and effectively.
