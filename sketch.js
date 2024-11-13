let font;
let tSize = 250; // size of text
let tposX = 250; // x position of text
let tposY = 500; // y position of text
let pointCount = 0.8; // 0-1; 0 = few particles, 1 = more particles

let speed = 70; // speed of particles
let comebackSpeed = 1000; // behavior of particles after interaction
let dia = 500; // diameter of interaction (adjusted for closer attraction)
let randomPos = true; // start particles at random positions
let pointsDirection = "down"; // initial direction for points
let interactionDirection = 1; // 1 is pulling, -1 is pushing

let textPoints = [];
let scatteredParticles = true; // control if particles are scattered at start
let suckedIn = false; // track if particles are sucked in
let currentWord = "hello"; // starting word
let nextWord = "bye"; // word to transform into
let menuWord = "menu"; // word to form after shake
let showingMenu = false; // track if the menu is shown

// Variables for shake detection
let prevMouseX, prevMouseY;
let shakeThreshold = 10; // set the shake threshold (adjustable)

function preload() {
  font = loadFont("AvenirNextLTPro-Demi.otf");
}

function setup() {
  createCanvas(1000, 1000);
  
  // Create scattered particles initially
  if (scatteredParticles) {
    setupScatteredParticles(500); // Initialize with 500 scattered particles
  } else {
    setupTextPoints(currentWord); // Else, set up particles in text shape
  }
  
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

// Function to initialize scattered particles
function setupScatteredParticles(numParticles) {
  textPoints = []; // Clear any previous particles
  for (let i = 0; i < numParticles; i++) {
    // Generate particles at random positions
    let randomX = random(width);
    let randomY = random(height);
    let textPoint = new Interact(
      randomX,
      randomY,
      speed,
      dia,
      true,         // Set random position true for initial scatter
      comebackSpeed,
      "down",
      interactionDirection
    );
    textPoints.push(textPoint);
  }
}

// Function to set up particles in text formation
function setupTextPoints(word) {
  textPoints = []; // reset text points
  let points = font.textToPoints(word, tposX, tposY, tSize, {
    sampleFactor: pointCount,
  });

  console.log(`Setting up text points for word: ${word}`);

  for (let i = 0; i < points.length; i++) {
    let pt = points[i];
    let textPoint = new Interact(
      pt.x,
      pt.y,
      speed,
      dia,
      randomPos,
      comebackSpeed,
      pointsDirection,
      interactionDirection
    );
    textPoints.push(textPoint);
  }
}

function draw() {
  background(29, 60, 110);
  
  let allNearMouse = true;
  for (let i = 0; i < textPoints.length; i++) {
    let v = textPoints[i];
    v.update();
    v.show();
    v.behaviors();
    
    // Check if each point is close enough to the mouse
    if (dist(mouseX, mouseY, v.pos.x, v.pos.y) > dia / 2) {
      allNearMouse = false;
    }
  }

  // Transition from scattered to "hello" text formation when all particles are near the mouse
  if (allNearMouse && scatteredParticles) {
    console.log("All particles gathered! Forming 'hello'.");
    scatteredParticles = false;
    suckedIn = true; // Set particles to "sucked in" state
    setupTextPoints(currentWord); // Reorganize particles to form "hello"
  }

  // Shake detection and transition to "bye"
  let mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  if (suckedIn && mouseSpeed > shakeThreshold) {
    console.log("Shake detected! Releasing particles to form 'menu'.");
    suckedIn = false; // Release particles
    showingMenu = true; // Set flag to show menu
    setupTextPoints(menuWord); // Set up new text points for "menu"
  }

  // Update previous mouse position
  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

// Interact class with adjustments for "sucked" behavior
function Interact(x, y, m, d, t, s, di, p) {
    this.home = t ? createVector(random(width), random(height)) : createVector(x, y);
    this.pos = this.home.copy();
    this.target = createVector(x, y);

    if (di == "general") {
        this.vel = createVector();
    } else if (di == "up") {
        this.vel = createVector(0, -y);
    } else if (di == "down") {
        this.vel = createVector(0, y);
    } else if (di == "left") {
        this.vel = createVector(-x, 0);
    } else if (di == "right") {
        this.vel = createVector(x, 0);
    }

    this.acc = createVector();
    this.r = 8;
    this.maxSpeed = m;
    this.maxforce = 1;
    this.dia = d;
    this.come = s;
    this.dir = p;
    this.stuckToMouse = false; // New flag to check if particle is stuck to mouse
}

Interact.prototype.behaviors = function () {
    let arrive = this.arrive(this.target);
    let mouse = createVector(mouseX, mouseY);
    
    // Check if particle is close to mouse and should stick to it
    if (dist(mouse.x, mouse.y, this.pos.x, this.pos.y) < this.dia / 2 && !this.stuckToMouse && suckedIn) {
        this.stuckToMouse = true; // Stick particle to mouse
    }
    
    if (this.stuckToMouse && suckedIn) {
        // If particle is stuck, set target to mouse position
        this.target = mouse;
    } else {
        // Otherwise, flee from the mouse normally
        let flee = this.flee(mouse);
        this.applyForce(flee);
    }

    this.applyForce(arrive);
}

Interact.prototype.applyForce = function (f) {
    this.acc.add(f);
}

Interact.prototype.arrive = function (target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();
    let speed = this.maxSpeed;

    // Increase the attraction when close to the mouse
    if (d < this.dia) {
        speed = map(d, 0, this.dia, this.maxSpeed * 2, this.maxSpeed); // Double the speed when close
    }
    
    if (d < this.come) {
        speed = map(d, 0, this.come, 0, this.maxSpeed);
    }

    desired.setMag(speed);
    let steer = p5.Vector.sub(desired, this.vel);
    return steer;
}

Interact.prototype.flee = function (target) {
    let desired = p5.Vector.sub(target, this.pos);
    let d = desired.mag();

    if (d < this.dia) {
        desired.setMag(this.maxSpeed);
        desired.mult(this.dir);
        let steer = p5.Vector.sub(desired, this.vel);
        steer.limit(this.maxForce);
        return steer;
    } else {
        return createVector(0, 0);
    }
}

Interact.prototype.update = function () {
    this.pos.add(this.vel);
    this.vel.add(this.acc);
    this.acc.mult(0);
}

Interact.prototype.show = function () {
    stroke(255);
    strokeWeight(4);
    point(this.pos.x, this.pos.y);
}
