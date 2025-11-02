1. HTML (Structure) 🏗️
HTML (HyperText Markup Language) provides the structure and content of the web page. It defines the elements the user sees.

  Role in App: It defines the main layout, including the title, input fields, buttons, and display areas.
  
  Key Elements:
  
  <input>: Used to accept user definitions for the geofence radius, center latitude, and longitude.
  
  <button>: Used to Start/Stop Tracking and Set Center to My Current Location.
  
  <div> with ids: These are the containers used by JavaScript to read user input (e.g., radius) and display output (e.g., zoneStatus, eventLog).
  
  Mobile-First Meta Tag: The line <meta name="viewport" content="width=device-width, initial-scale=1.0"> is crucial for mobile. It ensures the browser renders the page correctly on mobile screen sizes, allowing Tailwind CSS to apply its responsive styles effectively.

2. Tailwind CSS (Styling) 🎨
Tailwind CSS is a utility-first CSS framework that dictates the appearance and layout of the HTML elements. It is included via a Content Delivery Network (CDN) link.

  Role in App: It provides the modern, clean, and mobile-responsive look, eliminating the need for a separate CSS file.
  
  Key Utilities:
  
  Layout: Utilities like flex, items-center, w-full, and max-w-lg center the app and limit its width for readability on large screens while ensuring it fills the screen on mobile.
  
  Styling: Classes like bg-white, rounded-xl, shadow-lg, font-bold, and p-6 create the distinct "card" look for the setup, status, and log sections.
  
  State-Driven Colors: JavaScript dynamically changes classes like bg-green-500 (for INSIDE ZONE) and bg-red-500 (for OUTSIDE ZONE) on the zoneStatus div to give immediate visual feedback.

3. Vanilla JavaScript (Logic and Interactivity) 🧠
Vanilla JavaScript (JS) is the engine that handles the logic, interactivity, and communication with the browser's APIs.

  Role in App: It performs four main tasks:
  
  Reads Inputs: Gets the radius, centerLat, and centerLon values from the HTML inputs.
  
  Location Tracking: Uses the browser's built-in navigator.geolocation.watchPosition() method. This continuously monitors and reports the device's GPS coordinates (Latitude and Longitude) at set intervals.
  
  Distance Calculation: For every new location update, the JS code executes the complex Haversine formula to accurately calculate the distance (in meters) between the current position and the defined geofence center.
  
  Geofencing Logic:
  
  It compares the calculated distance to the defined radius.
  
  If the user's state changes (e.g., they were outside and are now inside), it triggers a ZONE ENTRY or ZONE EXIT event.

Updates UI: It writes the real-time distance, current coordinates, and event messages back into the relevant HTML elements (distanceOutput, eventLog), and toggles the Tailwind CSS classes for the status colors.
