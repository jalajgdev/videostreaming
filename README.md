

Steps to run the project -  my-video-task is a folder name then change the directory to video-task & then run the command npm start .


Approach : 

Component Structure: The application is structured as a functional component named VideoStreamingApp, responsible for managing the video streaming interface and related functionality.

State Management: React's useState hook is utilized to manage various states such as video URLs, playback status, buffering status, recording status, errors, etc.

Effect Hooks: useEffect hooks are employed to handle side effects like setting up event listeners for video buffering and errors, checking network connectivity, and managing online/offline status.

Media Recording: Users can record their screen using the navigator.mediaDevices.getDisplayMedia() API. Media recording is facilitated through the MediaRecorder interface, with progress tracked during recording.

Event Handling: Functions are defined to handle events such as buffering, loaded data, errors, and video switching, updating the component state accordingly for a seamless user experience.

UI Rendering: The component renders a user interface comprising main and side videos, playback controls, recording indicators, and error notifications. Material-UI components are utilized for styling and user interaction.

Libraries Used:

React: A JavaScript library for building user interfaces.
@mui/material: Material-UI components for React applications.
@mui/icons-material: Material-UI icons for React applications.

