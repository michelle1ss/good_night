/*
  Variation Sketch - Do Not Go Gentle Into That Good Night
  Date: [29/12/2023]
  Author: [Biyang Shao]

  Instructions:
  - This project is interactive, where the camera captures the audience's gestures of clenching or opening their hands to control the aggregation and dispersion of pixel particles in the image.

  Blurb:
  - The project embodies the idea that as things gradually dissipate over time, our efforts to prevent their dissipation may seem futile, yet they imprint the essence of our lives. Time signifies rebirth, transformation, and renewal. Every attempt to bring about change represents hope, a possibility that demands our participation.

  Acknowledgements:
  - Inspiration from [Topographies of Fragility by Ingrid Weyland, the poem "Do Not Go Gentle Into That Good Night" by Dylan Thomas and "The Order of Time" by Carlo Rovelli]

  - References: The project utilizes ML5.js' Handpose for gesture recognition. Code is derived from the following link:
    https://learn.ml5js.org/#/reference/handpose?id=handpose 
    https://youtu.be/aE7kW4b6CjA?si=vHKUAjSg_qKmQzHF
    Loading, pixelating and particleizing image from: WCC 1 Week 6: Sampling
    full-screen mode from: https://p5js.org/reference/#/p5/fullscreen
    
Acknowledgements for AI Generation:

I acknowledge the use of [1] AI Image Generation Tools (https://douchu.ai/) to [2] produce images that formed [4] an integral component of my final project, contributing to a larger artwork. On December 28, 2023, I provided the following prompts for image generation:
• [3] Generating images depicting nature, volcanoes, light sources, hills, and plants.

I acknowledge the use of [1] ChatGPT (https://chat.openai.com/) [2] to refine the academic language and accuracy of my own work. On 4 January 2023 I submitted my entire essay (link to document here) with the instruction to [3] “Improve the academic tone and accuracy of language, including grammatical structures, punctuation and vocabulary”. [4] The output (here) was then modified further to better represent my own tone and style of writing.

*/

let img; // Variable to store the loaded image data
let particles = []; // Array to hold particle objects
let isFist = false; // Flag indicating fist gesture detection
let handpose; // Handpose model
let video; // Video stream
let predictions = []; // Array to store hand gesture predictions
let imagePaths = ['nature7.jpg', 'nature8.jpg', 'nature9.jpg']; // Array containing image paths
let currentImageIndex = 0; // Current image index
let interval = 45 * 1000; // Interval for image switching (45 seconds)
let lastImageChangeTime = 0; // Time of the last image switch

function preload() {
  loadNewImage(imagePaths[currentImageIndex]); // Preload the initial image
}

function setup() {
  createCanvas(windowWidth, windowHeight); // Create a canvas
  img.resize(windowWidth, 0); // Resize the image (width fills window, height adjusts proportionally)
  img.loadPixels(); // Load image pixels
  // Create particles from image pixels
  for (let y = 0; y < img.height; y += 20) {
    for (let x = 0; x < img.width; x += 20) {
      let index = (x + y * img.width) * 4;
      let col = color(img.pixels[index], img.pixels[index + 1], img.pixels[index + 2], img.pixels[index + 3]);
      let brightness = (red(col) + green(col) + blue(col)) / 3;
      let radius = map(brightness, 0, 255, 5, 7);
      particles.push(new Particle(x, y, radius, col));
    }
  }

  video = createCapture(VIDEO); // Create a video capture object
  video.size(windowWidth, windowHeight); // Set video stream size

  const options = {
    flipHorizontal: true, // Boolean value for whether the video should be flipped (defaults to false)
    maxContinuousChecks: Infinity, // Number of frames to go without running the bounding box detector. Defaults to infinity, decrease if consistently poor predictions.
    detectionConfidence: 0.98, // Threshold for discarding a prediction. Defaults to 0.8.
    scoreThreshold: 0.75, // Threshold for removing multiple detections based on non-maximum suppression. Defaults to 0.75.
    iouThreshold: 0.3, // Threshold to decide whether boxes overlap too much in non-maximum suppression. Must be between [0, 1]. Defaults to 0.3.
  };

  handpose = ml5.handpose(video, options, modelReady); // Initialize Handpose model

  // Sets up an event to fill the global variable "predictions" with an array every time new hand poses are detected
  handpose.on("predict", (results) => {
    predictions = results;
  });

  video.hide(); // Hide the video element, show only the canvas
}

function modelReady() {
  console.log("Model ready!");
}

function draw() {
  background(255, 30); // Set background color with transparency
  meanSquaredError(); // Calculate mean squared error for gesture detection
  for (let i = 0; i < particles.length; i++) {
    particles[i].update(); // Update particle's position
    particles[i].display(); // Display the particle
  }

  // Display the original image at the bottom with reduced opacity
  image(img, 0, 0, windowWidth, windowHeight); // Display the image on the canvas
  tint(255, 50); // Apply transparency to the image

  // Check if it's time to switch images based on interval
  if (millis() - lastImageChangeTime > interval) {
    currentImageIndex = (currentImageIndex + 1) % imagePaths.length; // Switch to the next image in the array
    loadNewImage(imagePaths[currentImageIndex]); // Load a new image and regenerate pixel particles
    lastImageChangeTime = millis(); // Update the time for the next image switch
  }
}

// Load a new image and regenerate pixel particles
function loadNewImage(imagePath) {
  img = loadImage(imagePath, () => {
    img.resize(windowWidth, 0); // Resize the loaded image to fit the canvas width
    img.loadPixels(); // Load pixel data of the new image
    generateParticles(); // Regenerate pixel particles based on the new image
  });
}

// Function to generate pixel particles based on the loaded image
function generateParticles() {
  particles = []; // Clear previous particles from the array
  // Loop through the image pixels to create particles
  for (let y = 0; y < img.height; y += 20) {
    for (let x = 0; x < img.width; x += 20) {
      let index = (x + y * img.width) * 4; // Calculate the pixel index
      let col = color(img.pixels[index], img.pixels[index + 1], img.pixels[index + 2], img.pixels[index + 3]); 
      // Get pixel color
      let brightness = (red(col) + green(col) + blue(col)) / 3; // Calculate brightness
      let radius = map(brightness, 0, 255, 5, 7); // Map brightness to particle size
      particles.push(new Particle(x, y, radius, col)); // Create and store a new particle object
    }
  }
}

// Function to draw ellipses over detected keypoints
function meanSquaredError() {
  let totalX = 0; // Total sum of X coordinates of all keypoints
  let totalY = 0; // Total sum of Y coordinates of all keypoints
  let totalError = 0; // Total mean squared error

  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    // Loop through all keypoints in the prediction
    for (let j = 0; j < prediction.landmarks.length; j += 1) {
      const keypoint = prediction.landmarks[j];
      fill(0, 255, 0); // Set fill color for keypoints
      noStroke(); // Disable stroke for keypoints
      ellipse(keypoint[0], keypoint[1], 10, 10); // Draw ellipses representing keypoints

      // Accumulate X and Y coordinates to compute the center
      totalX += keypoint[0];
      totalY += keypoint[1];
    }

    // Calculate the center point coordinates
    const centerX = totalX / (predictions.length * prediction.landmarks.length);
    const centerY = totalY / (predictions.length * prediction.landmarks.length);

    // Calculate mean squared error between keypoints and center point and accumulate it
    for (let j = 0; j < prediction.landmarks.length; j += 1) {
      const keypoint = prediction.landmarks[j];
      const errorX = keypoint[0] - centerX; // Compute the error in X direction
      const errorY = keypoint[1] - centerY; // Compute the error in Y direction
      const squaredError = errorX * errorX + errorY * errorY; // Calculate squared error
      totalError += squaredError; // Accumulate squared errors
    }

    // Calculate mean squared error
    const meanSquaredError = totalError / prediction.landmarks.length;

    // Determine if the mean squared error indicates a fist gesture or not
    if (meanSquaredError < 5000) {
      isFist = true; // Gesture is recognized as a fist
    } else {
      isFist = false; // Gesture is not recognized as a fist
    }

    console.log("Mean Squared Error: " + meanSquaredError); // Output mean squared error to console
  }
}

// Particle class definition
class Particle {
  constructor(x, y, r, col) {
    this.position = createVector(x, y); // Set initial position of the particle
    this.velocity = createVector(random(-1, 1), random(-1, 1)); // Set initial random velocity
    this.acceleration = createVector(0, 0); // Set initial acceleration
    this.radius = r; // Set the radius of the particle
    this.col = col; // Set the color of the particle
  }

  update() {
    this.position.add(this.velocity); // Update particle's position based on velocity
    this.velocity.add(this.acceleration); // Update particle's velocity based on acceleration
    this.velocity.limit(10); // Limit the maximum velocity of the particle
    if (this.position.x < 0 || this.position.x > width) {
      this.velocity.x *= -1; // Reverse particle's x-velocity if it goes beyond canvas width
    }
    if (this.position.y < 0 || this.position.y > height) {
      this.velocity.y *= -1; // Reverse particle's y-velocity if it goes beyond canvas height
    }

    let center = createVector(width / 2, height / 2); // Calculate the center of the canvas

    // If a fist gesture is detected, calculate acceleration for particles
    if (isFist) {
      let diff = p5.Vector.sub(center, this.position); // Calculate the vector from the particle to the canvas center
      this.acceleration = diff.div(300); // Set the acceleration based on the vector distance from the center
      diff.limit(5); // Limit the magnitude of the difference vector
    } else {
      // Otherwise, no acceleration is applied
      this.acceleration.x = 0;
      this.acceleration.y = 0;
    }
  }

  display() {
    noStroke(); // Disable stroke for the particle
    fill(this.col); // Set fill color for the particle
    ellipse(this.position.x, this.position.y, this.radius * 2); // Draw the particle as an ellipse
  }
}

// Resize canvas when the window size changes
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // Adjust canvas size to match the window size
}

// Press the S key to save your drawing
function keyPressed() {
  if (key === 's') {
    save("drawing.png");
  }
}
// If the mouse is pressed,
// toggle full-screen mode.
function mousePressed() {
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    let fs = fullscreen();
    fullscreen(!fs);
  }
}