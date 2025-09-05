# 🎬 FrameAnnotate.js

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Browser Support](https://img.shields.io/badge/Browser-Chrome%20%7C%20Firefox%20%7C%20Safari%20%7C%20Edge-blue)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![WebM Video](https://img.shields.io/badge/Export-WebM%20Video-red?logo=webm)](https://www.webmproject.org/)
[![ZIP Archive](https://img.shields.io/badge/Export-ZIP%20Archive-blue?logo=zip)](https://en.wikipedia.org/wiki/ZIP_(file_format))

> **A powerful, browser-based video annotation tool with optical flow tracking and multiple export formats. No installation required - runs entirely in your browser!**

## 🚀 Quick Demo

![Demo Preview](https://via.placeholder.com/800x400/FF6B6B/FFFFFF?text=Video+Annotation+Tool+Demo)

*Create bounding box annotations on videos with automatic object tracking using Lucas-Kanade optical flow*

**Key Features:** ✨ Zero Installation • 🎯 Optical Flow Tracking • 📤 Multiple Export Formats • 🎨 Custom Annotation Classes

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Live Demo](#-live-demo)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Technical Specifications](#-technical-specifications)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Use Cases](#-use-cases--applications)
- [Contributing](#-contributing)
- [License](#-license)

## ⚡ Quick Start

### 1️⃣ **Download & Run**
```bash
# Clone the repository
git clone https://github.com/yourusername/frameannotate.js.git
cd frameannotate.js

# Open index.html in your browser (no build process required!)
# Or serve with a simple HTTP server:
python -m http.server 8000
# Navigate to http://localhost:8000
```

### 2️⃣ **Start Annotating**
1. **📁 Upload Video** → Select any video file (MP4, WebM, AVI, etc.)
2. **🎨 Create Annotations** → Press `N` and click to create bounding boxes
3. **🔄 Track Objects** → Automatic tracking with optical flow
4. **📤 Export Results** → Download as video, ZIP, or XML

### 3️⃣ **Example Workflow**
```javascript
// The tool handles everything automatically, but here's what happens under the hood:
1. Video → Frame Extraction (30 FPS)
2. Manual Annotation → Bounding Box Creation  
3. Optical Flow → Automatic Object Tracking
4. Export → WebM Video | ZIP Archive | XML Data
```

## 🎯 Live Demo

**Try it now:** [https://AmanTewariSkoolKid.github.io/frameannotate.js](https://AmanTewariSkoolKid.github.io/frameannotate.js)

*No signup required - works directly in your browser with your local video files*

## ✨ Features

### 🎯 **Core Functionality**
| Feature | Description | Status |
|---------|-------------|--------|
| 📹 **Video Frame Extraction** | Extract frames at customizable FPS (default: 30) | ✅ |
| 🎨 **Interactive Annotation** | Click-and-drag bounding box creation | ✅ |
| 🔄 **Optical Flow Tracking** | Lucas-Kanade algorithm for automatic object tracking | ✅ |
| 📊 **Progress Tracking** | Real-time progress indicators for all operations | ✅ |
| 💾 **Multiple Formats** | Import/Export in various formats | ✅ |

### 🚀 **Advanced Features**
- **⚡ Real-time Preview** - Live video playback with annotation overlay
- **🎛️ Speed Control** - Adjustable playback speed (0.1x to 5.0x)
- **👁️ Visibility Toggle** - Show/hide individual annotations
- **🏷️ Custom Classes** - Create annotation categories with unique colors
- **📤 Dual Export** - Export as annotated video or frame archive
- **⌨️ Keyboard Shortcuts** - Professional hotkey support
- **🎯 Precision Tools** - Frame-by-frame navigation and browser zoom support

### 🖱️ **User Interface**
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🎨 Modern UI** - Clean interface with jQuery UI components  
- **🎮 Game-like Controls** - Intuitive keyboard and mouse interactions
- **📋 Step-by-step Workflow** - Guided 7-step annotation process

## 🛠️ Technical Specifications

### 📋 **System Requirements**
```yaml
Browser Support:
  Primary: Chrome (recommended)
  Tested: Firefox, Safari, Edge
  
JavaScript: ES6+ support required
APIs: HTML5 Canvas, File API, Video API
Memory: 4GB+ RAM recommended for large videos
Storage: Browser-based (IndexedDB via PouchDB)
```

### 🔧 **Core Technologies & Dependencies**
| Technology | Version | Purpose | Size |
|------------|---------|---------|------|
| **jQuery** | 1.12.4 | DOM manipulation & UI | ~84KB |
| **jQuery UI** | Latest | Interactive widgets & controls | ~240KB |
| **JSFeat** | Latest | Computer vision & optical flow | ~120KB |
| **JSZip** | Latest | ZIP archive operations | ~110KB |
| **PouchDB** | Latest | Local database for frame caching | ~150KB |
| **StreamSaver.js** | Latest | Large file download streaming | ~15KB |
| **Nudged.js** | Latest | Geometric transformations | ~8KB |

### 📊 **Supported Formats**

#### 📥 **Input Formats**
```yaml
Video Files: 
  - MP4 (H.264/H.265)
  - WebM (VP8/VP9/AV1)  
  - AVI, MOV, MKV
  - Any HTML5 compatible format

Archives:
  - ZIP files with extracted frames
  
Annotations:
  - XML (VATIC-compatible format)
```

#### 📤 **Export Formats**
```yaml
Video Export:
  - WebM format with embedded annotations
  - Customizable quality and bitrate

Frame Export: 
  - ZIP archive with annotated JPEG frames
  - Individual frames with bounding boxes

Data Export:
  - XML (VATIC-compatible)
  - JSON metadata
  - Raw frames (ZIP)
```

### ⚙️ **Configuration Options**
```javascript
// Default configuration in annotate.js
const config = {
  fps: 30,                           // Frame extraction rate
  playbackRate: 0.4,                 // Processing speed (40% for reliability)
  imageMimeType: 'image/jpeg',       // Frame format  
  imageExtension: '.jpg',            // File extension
  framesZipFilename: 'extracted-frames.zip'
};

// Annotation classes in class-manager.js
const defaultClasses = {
  'cracks': '#FF0000',    // Red
  'spalling': '#00FF00',  // Green  
  'corrosion': '#0000FF', // Blue
  'general': '#FFFF00'    // Yellow
};
```

## 📖 Usage Guide

### 🎬 **Complete Annotation Workflow**

#### **Step 1: Video Upload & Processing**
```bash
1. Select video file (MP4, WebM, AVI, etc.)
2. Frame extraction begins automatically  
3. Progress indicator shows completion status
4. Canvas initializes with video dimensions
```

#### **Step 2: Create Annotation Classes** 
```bash
1. Navigate to "Annotation Class Management" section
2. Enter class name (e.g., "cracks", "defects", "objects")  
3. Choose unique color for the class
4. Click "Add Class" to register
```

#### **Step 3: Manual Annotation**
```bash
1. Press 'N' key to enter annotation mode
2. Select annotation class from dropdown
3. Click and drag to create bounding box
4. Object automatically gets unique ID
5. Optical flow begins tracking across frames
```

#### **Step 4: Review & Refine**
```bash
1. Use playback controls to navigate frames
2. Adjust bounding boxes as needed
3. Toggle visibility to focus on specific objects
4. Add comments or metadata to annotations
```

#### **Step 5: Export Results**
```bash
# Export Options:
- Annotated Video (WebM with burned-in boxes)
- Annotated Frames (ZIP with individual images)  
- XML Annotations (VATIC-compatible format)
- Raw Frames (ZIP without annotations)
```

### ⌨️ **Keyboard Shortcuts & Controls**

| **Key/Action** | **Function** | **Context** |
|---------------|--------------|-------------|
| `Spacebar` | Play/Pause video | Global |
| `N` | New annotation mode | Global |
| `Escape` | Cancel current action | Annotation mode |
| `←` / `→` | Previous/Next frame | Video playback |
| `↑` / `↓` | Adjust playback speed | Video playback |
| `Click + Drag` | Create/Resize bounding box | Annotation mode |
| `Double Click` | Edit annotation properties | On annotation |

### 🎯 **Advanced Features**

#### **Custom Annotation Classes**
```javascript
// Create specialized classes for your use case
Examples:
- Infrastructure: "cracks", "spalling", "corrosion"  
- Vehicles: "car", "truck", "motorcycle", "bicycle"
- People: "person", "worker", "pedestrian"
- Objects: "tool", "equipment", "debris"
```

#### **Optical Flow Tracking**  
```bash
# Automatic object tracking between frames
1. Create initial bounding box
2. System calculates Lucas-Kanade optical flow
3. Bounding box follows object motion
4. Manual adjustment available when needed
```

#### **Batch Operations**
- **Show All**: Make all annotations visible
- **Hide All**: Hide all annotations for clear view  
- **Delete All**: Remove all annotations (with confirmation)

### 🔧 **Performance Optimization**

#### **For Large Videos**
```yaml
Recommendations:
  - Use Chrome browser for best performance
  - Close other browser tabs during processing
  - Ensure 4GB+ available RAM
  - Process videos under 500MB for optimal speed
  
Settings to Adjust:
  - Lower FPS for faster processing (15-20 FPS)
  - Reduce playback rate for accuracy (0.2-0.4)
  - Use JPEG format for smaller file sizes
```

#### **Browser Compatibility**
```yaml
Tested Browsers:
  ✅ Chrome 90+ (Recommended)
  ✅ Firefox 85+  
  ✅ Safari 14+
  ✅ Edge 90+
  
Known Issues:
  ⚠️ Safari: Slower optical flow processing
  ⚠️ Firefox: Large file download limitations
  ⚠️ Mobile: Limited performance on complex videos
```

## 🏗️ Architecture & File Structure

### 📁 **Project Structure**
```
frameannotate.js/
├── index.html              # Main application entry point
├── dist/                   # Core dependencies & libraries
│   ├── framez.js          # 🎬 Video frame extraction engine (1,299 lines)
│   ├── annotate.js        # 🎯 Main UI & annotation logic (2,746 lines)  
│   ├── class-manager.js   # 🏷️ Annotation class management (338 lines)
│   ├── annotation-manager.js # 📋 Individual annotation cards (586 lines)
│   ├── style.css          # 🎨 Visual styling & layout
│   ├── jquery-1.12.4.js   # 🔧 DOM manipulation library
│   ├── jquery-ui.js       # 🖱️ Interactive UI widgets
│   ├── jsfeat.js          # 👁️ Computer vision & optical flow
│   ├── jszip.js           # 📦 ZIP archive operations
│   ├── pouchdb.min.js     # 💾 Local database storage
│   ├── StreamSaver.js     # 📤 Large file downloads
│   ├── nudged.js          # 📐 Geometric transformations
│   ├── compatibility.js   # 🔄 Browser compatibility layer
│   └── polyfill.js        # 🔧 Modern feature support
├── README.md               # 📖 This documentation
└── LICENSE                 # ⚖️ MIT License
```

### 🧩 **Core Components**

#### **📹 FramesManager (`framez.js`)**
```javascript
// Handles video frame extraction and storage
class FramesManager {
  - Video processing pipeline
  - Frame extraction at configurable FPS
  - PouchDB integration for efficient caching
  - Progress tracking and error handling
}
```

#### **🎯 AnnotatedObjectsTracker (`annotate.js`)**  
```javascript
// Manages object tracking across frames
- Lucas-Kanade optical flow implementation
- Bounding box creation and manipulation
- Frame-by-frame object persistence
- User interaction handling (keyboard/mouse)
```

#### **🏷️ ClassManager (`class-manager.js`)**
```javascript
// Dynamic annotation class system
- Runtime class creation with unique colors
- Default classes: cracks, spalling, corrosion, general
- Color validation and conflict resolution
- Integration with annotation workflow
```

#### **📋 AnnotationManager (`annotation-manager.js`)**
```javascript  
// Individual annotation card management
- Detailed annotation information display
- Visibility controls and metadata editing
- Bulk operations (show/hide/delete all)
- Real-time sync with video playback
```

### 🔄 **Data Flow Architecture**
```
Video Input → Frame Extraction → Canvas Initialization → User Annotation 
     ↓                                                         ↓
Export Options ← Annotation Storage ← Optical Flow Tracking ←  ┘
     ↓
WebM Video | ZIP Archive | XML Data
```

## 🔧 API Reference & Customization

### **Configuration API**
```javascript
// Modify global settings in annotate.js
const config = {
  fps: 30,                    // Frame extraction rate (15-60)
  playbackRate: 0.4,          // Processing speed (0.1-1.0)
  imageMimeType: 'image/jpeg', // Frame format ('image/jpeg'|'image/png')
  imageExtension: '.jpg',      // File extension
  framesZipFilename: 'extracted-frames.zip'
};
```

### **Annotation Styling**
```javascript
// Modify annotation appearance in annotate.js
ctx.strokeStyle = '#FF0000';  // Red bounding boxes
ctx.lineWidth = 2;            // 2px border width
ctx.font = '16px Arial';      // Label font
ctx.fillStyle = '#FF0000';    // Label color
```

### **Class Management API**
```javascript
// Add custom annotation classes
function addCustomClass(name, color) {
  annotationClasses[name] = color;
  updateClassDisplay();
  updateClassDropdown();
}

// Example usage
addCustomClass('vehicles', '#FF5722');
addCustomClass('pedestrians', '#4CAF50');
```

## 🎯 Use Cases & Applications

### **🏗️ Infrastructure Inspection**
- **Bridge/Building Assessment**: Crack detection and monitoring
- **Road Surface Analysis**: Pothole and surface defect mapping  
- **Pipeline Inspection**: Corrosion and damage identification

### **🚗 Transportation & Logistics**
- **Traffic Analysis**: Vehicle counting and classification
- **Parking Management**: Space utilization tracking
- **Fleet Monitoring**: Vehicle condition assessment

### **🏭 Industrial Applications**  
- **Quality Control**: Product defect identification
- **Safety Monitoring**: PPE compliance verification
- **Equipment Inspection**: Machinery wear assessment

### **🔬 Research & Development**
- **Behavioral Studies**: Animal/human movement tracking
- **Environmental Monitoring**: Change detection over time
- **Medical Imaging**: Anatomical structure annotation

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### **🐛 Bug Reports**
```bash
# When reporting bugs, please include:
1. Browser version and operating system
2. Video file details (format, size, duration)
3. Steps to reproduce the issue
4. Console error logs (F12 → Console)
5. Expected vs actual behavior
```

### **🚀 Feature Requests**
```bash
# For new features, please provide:
1. Clear description of the use case
2. Mockups or examples if applicable  
3. Performance considerations
4. Compatibility requirements
```

### **💻 Development Setup**
```bash
# Fork the repository
git clone https://github.com/yourusername/frameannotate.js.git
cd frameannotate.js

# No build process required - direct development
# Simply edit files and refresh browser

# Test in multiple browsers
# Run local server for testing:
python -m http.server 8000
```

### **📝 Code Standards**
- **JavaScript**: ES6+ with comprehensive comments
- **HTML**: Semantic markup with accessibility considerations  
- **CSS**: BEM methodology for class naming
- **Documentation**: Inline comments explaining complex algorithms

## 📞 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/frameannotate.js/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/frameannotate.js/discussions)  
- 📧 **Email Support**: Create an issue for direct contact
- 📚 **Documentation**: [Wiki](https://github.com/yourusername/frameannotate.js/wiki)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### **Third-party Licenses**
- jQuery: MIT License
- JSFeat: MIT License  
- PouchDB: Apache 2.0 License
- JSZip: MIT License

## 🙏 Acknowledgments

Special thanks to the open-source community and these amazing libraries:

- **[JSFeat](https://inspirit.github.io/jsfeat/)** - Computer vision algorithms
- **[jQuery](https://jquery.com/)** - DOM manipulation and UI
- **[PouchDB](https://pouchdb.com/)** - Client-side database
- **[JSZip](https://stuk.github.io/jszip/)** - ZIP file operations
- **[StreamSaver.js](https://github.com/jimmywarting/StreamSaver.js)** - File download streaming

## 🆚 Comparison with Alternatives

| Feature | FrameAnnotate.js | VATIC | LabelMe | CVAT |
|---------|------------------|-------|---------|------|
| **Installation** | ✅ None (Browser) | ❌ Complex Setup | ❌ Server Required | ❌ Docker Required |
| **Optical Flow** | ✅ Built-in | ❌ Manual Only | ❌ Manual Only | ✅ Available |
| **Offline Use** | ✅ Full Support | ❌ Server Dependent | ❌ Server Dependent | ❌ Server Dependent |
| **Video Export** | ✅ WebM Output | ❌ Frames Only | ❌ Frames Only | ✅ Multiple Formats |
| **Custom Classes** | ✅ Runtime Creation | ❌ Pre-configured | ✅ Limited | ✅ Full Support |
| **Learning Curve** | ✅ Minimal | ⚠️ Moderate | ⚠️ Moderate | ❌ Steep |

---

<p align="center">
  <strong>🎬 Happy Annotating with FrameAnnotate.js! 🎯</strong><br>
  <sub><em>An improvement over VATIC.js, but 9 years younger and browser-native</em></sub>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-usage-guide">Usage Guide</a> •
  <a href="#-contributing">Contributing</a>
</p>
