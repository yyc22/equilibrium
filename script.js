// Le Chatelier's Principle Interactive Simulation

// Global variables
let simulationRunning = false;
let animationSpeed = 3;
let activeTab = 'concentration';
let particles = [];
let equilibriumState = {
    concentrationA: 1.0,
    concentrationB: 1.0,
    concentrationC: 1.0,
    temperature: 25,
    pressure: 1.0,
    catalystPresent: false,
    kValue: 1.0,
    qValue: 1.0,
    shiftDirection: 'None'
};

// Constants for simulation
const PARTICLE_RADIUS = 8;
const PARTICLE_COLORS = {
    A: '#e74c3c', // Red
    B: '#3498db', // Blue
    C: '#2ecc71', // Green
    D: '#f39c12', // Orange
    inert: '#95a5a6' // Gray
};
const REACTION_RATE_BASE = 0.05;
const CANVAS_UPDATE_INTERVAL = 30; // ms

// DOM Elements
const canvas = document.getElementById('simulation-canvas');
const ctx = canvas.getContext('2d');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const resetButton = document.getElementById('reset-button');
const speedSlider = document.getElementById('speed-slider');
const temperatureSlider = document.getElementById('temperature-slider');
const pressureSlider = document.getElementById('pressure-slider');
const catalystToggle = document.getElementById('catalyst-toggle');
const challengeButton = document.getElementById('challenge-button');

// Initialize the simulation
function initSimulation() {
    // Set up event listeners
    setupEventListeners();
    
    // Initialize the canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create initial particles
    createInitialParticles();
    
    // Start animation loop
    simulationRunning = true;
    requestAnimationFrame(animateSimulation);
    
    // Update data display
    updateDataDisplay();
}

// Set up event listeners for all interactive elements
function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Reset button
    resetButton.addEventListener('click', resetSimulation);
    
    // Speed slider
    speedSlider.addEventListener('input', () => {
        animationSpeed = parseInt(speedSlider.value);
    });
    
    // Concentration controls
    document.getElementById('add-a').addEventListener('click', () => addParticle('A'));
    document.getElementById('remove-a').addEventListener('click', () => removeParticle('A'));
    document.getElementById('add-b').addEventListener('click', () => addParticle('B'));
    document.getElementById('remove-b').addEventListener('click', () => removeParticle('B'));
    document.getElementById('add-c').addEventListener('click', () => addParticle('C'));
    document.getElementById('remove-c').addEventListener('click', () => removeParticle('C'));
    
    // Temperature slider
    temperatureSlider.addEventListener('input', updateTemperature);
    
    // Pressure slider
    pressureSlider.addEventListener('input', updatePressure);
    
    // Add inert gas button
    document.getElementById('add-inert').addEventListener('click', addInertGas);
    
    // Catalyst toggle
    catalystToggle.addEventListener('click', toggleCatalyst);
    
    // Challenge button
    challengeButton.addEventListener('click', startChallenge);
}

// Switch between tabs
function switchTab(tabName) {
    // Update active tab button
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Update active tab content
    tabContents.forEach(content => {
        if (content.id === tabName + '-controls') {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
    
    // Update active tab variable
    activeTab = tabName;
    
    // Reset simulation for the new tab
    resetSimulation();
    
    // Update explanation text
    updateExplanationText();
}

// Update the explanation text based on active tab
function updateExplanationText() {
    const explanationText = document.getElementById('explanation-text');
    
    switch(activeTab) {
        case 'concentration':
            explanationText.innerHTML = `
                <p>Le Chatelier's principle states that when a system at equilibrium is subjected to a change in concentration, the equilibrium will shift to counteract that change.</p>
                <p><strong>Adding reactants (A or B):</strong> Shifts equilibrium to the right, producing more C.</p>
                <p><strong>Removing reactants (A or B):</strong> Shifts equilibrium to the left, consuming less C.</p>
                <p><strong>Adding products (C):</strong> Shifts equilibrium to the left, producing more A and B.</p>
                <p><strong>Removing products (C):</strong> Shifts equilibrium to the right, consuming more A and B.</p>
            `;
            break;
        case 'temperature':
            explanationText.innerHTML = `
                <p>For this exothermic reaction (one that releases heat), temperature changes affect the equilibrium position:</p>
                <p><strong>Increasing temperature:</strong> Shifts equilibrium to the left (toward reactants), as the system tries to absorb the added heat.</p>
                <p><strong>Decreasing temperature:</strong> Shifts equilibrium to the right (toward products), as the system tries to generate more heat.</p>
                <p>For endothermic reactions (those that absorb heat), the effects would be reversed.</p>
            `;
            break;
        case 'pressure':
            explanationText.innerHTML = `
                <p>For gaseous reactions, pressure changes affect the equilibrium position based on the number of gas molecules on each side:</p>
                <p><strong>Increasing pressure:</strong> Shifts equilibrium toward the side with fewer gas molecules.</p>
                <p><strong>Decreasing pressure:</strong> Shifts equilibrium toward the side with more gas molecules.</p>
                <p><strong>Adding inert gas at constant volume:</strong> No effect on equilibrium position.</p>
            `;
            break;
        case 'catalyst':
            explanationText.innerHTML = `
                <p>A catalyst affects the rate of a reaction but does not change the position of equilibrium:</p>
                <p><strong>With catalyst:</strong> Both forward and reverse reactions are sped up equally.</p>
                <p><strong>Effect on equilibrium:</strong> Equilibrium is reached faster, but the final concentrations remain the same.</p>
                <p>Catalysts lower the activation energy for both the forward and reverse reactions.</p>
            `;
            break;
    }
}

// Resize canvas to fit container
function resizeCanvas() {
    const container = document.querySelector('.reaction-vessel');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Create initial particles for the simulation
function createInitialParticles() {
    particles = [];
    
    // Create particles based on active tab
    switch(activeTab) {
        case 'concentration':
        case 'temperature':
            // Create 10 of each type
            for (let i = 0; i < 10; i++) {
                createParticle('A');
                createParticle('B');
                createParticle('C');
            }
            break;
        case 'pressure':
            // Create particles for gas reaction A + 2B ⇌ C + D
            for (let i = 0; i < 10; i++) {
                createParticle('A');
                createParticle('B');
                createParticle('B'); // Extra B for stoichiometry
                createParticle('C');
                createParticle('D');
            }
            break;
        case 'catalyst':
            // Same as concentration tab
            for (let i = 0; i < 10; i++) {
                createParticle('A');
                createParticle('B');
                createParticle('C');
            }
            break;
    }
    
    // Update concentration bars and data
    updateConcentrationBars();
    updateDataDisplay();
}

// Create a new particle of specified type
function createParticle(type) {
    const x = Math.random() * (canvas.width - 2 * PARTICLE_RADIUS) + PARTICLE_RADIUS;
    const y = Math.random() * (canvas.height - 2 * PARTICLE_RADIUS) + PARTICLE_RADIUS;
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    
    particles.push({
        type,
        x,
        y,
        vx,
        vy,
        radius: PARTICLE_RADIUS,
        color: PARTICLE_COLORS[type]
    });
}

// Add a particle of specified type
function addParticle(type) {
    createParticle(type);
    updateEquilibriumState();
    updateConcentrationBars();
    updateDataDisplay();
    updateShiftDirection();
}

// Remove a particle of specified type
function removeParticle(type) {
    const index = particles.findIndex(p => p.type === type);
    if (index !== -1) {
        particles.splice(index, 1);
        updateEquilibriumState();
        updateConcentrationBars();
        updateDataDisplay();
        updateShiftDirection();
    }
}

// Update temperature based on slider
function updateTemperature() {
    const temp = parseInt(temperatureSlider.value);
    document.getElementById('temperature-value').textContent = temp + '°C';
    
    equilibriumState.temperature = temp;
    
    // For exothermic reaction, higher temp shifts left
    if (temp > 50) {
        // Shift equilibrium to the left (more A and B, less C)
        adjustEquilibriumForTemperature(true);
    } else if (temp < 50) {
        // Shift equilibrium to the right (less A and B, more C)
        adjustEquilibriumForTemperature(false);
    }
    
    updateDataDisplay();
}

// Adjust equilibrium based on temperature change
function adjustEquilibriumForTemperature(shiftLeft) {
    // Calculate how many particles to convert based on temperature difference
    const tempDiff = Math.abs(equilibriumState.temperature - 50) / 10;
    const particlesToConvert = Math.floor(tempDiff);
    
    if (shiftLeft) {
        // Convert C to A and B
        for (let i = 0; i < particlesToConvert; i++) {
            const cIndex = particles.findIndex(p => p.type === 'C');
            if (cIndex !== -1) {
                particles.splice(cIndex, 1);
                createParticle('A');
                createParticle('B');
            }
        }
    } else {
        // Convert A and B to C
        for (let i = 0; i < particlesToConvert; i++) {
            const aIndex = particles.findIndex(p => p.type === 'A');
            const bIndex = particles.findIndex(p => p.type === 'B');
            if (aIndex !== -1 && bIndex !== -1) {
                particles.splice(aIndex, 1);
                particles.splice(bIndex > aIndex ? bIndex - 1 : bIndex, 1);
                createParticle('C');
            }
        }
    }
    
    updateEquilibriumState();
    updateConcentrationBars();
}

// Update pressure based on slider
function updatePressure() {
    const pressure = (parseInt(pressureSlider.value) / 50).toFixed(1);
    document.getElementById('pressure-value').textContent = pressure + ' atm';
    
    equilibriumState.pressure = parseFloat(pressure);
    
    // Adjust vessel size based on pressure (inverse relationship)
    const scale = 1 / equilibriumState.pressure;
    canvas.style.transform = `scale(${scale})`;
    
    // For reaction A + 2B ⇌ C + D (3 moles to 2 moles)
    if (equilibriumState.pressure > 1.0) {
        // Higher pressure shifts toward fewer moles (right)
        adjustEquilibriumForPressure(false);
    } else if (equilibriumState.pressure < 1.0) {
        // Lower pressure shifts toward more moles (left)
        adjustEquilibriumForPressure(true);
    }
    
    updateDataDisplay();
}

// Adjust equilibrium based on pressure change
function adjustEquilibriumForPressure(shiftLeft) {
    // Calculate how many particles to convert based on pressure difference
    const pressureDiff = Math.abs(equilibriumState.pressure - 1.0) * 5;
    const particlesToConvert = Math.floor(pressureDiff);
    
    if (shiftLeft) {
        // Convert C and D to A and 2B (more moles)
        for (let i = 0; i < particlesToConvert; i++) {
            const cIndex = particles.findIndex(p => p.type === 'C');
            const dIndex = particles.findIndex(p => p.type === 'D');
            if (cIndex !== -1 && dIndex !== -1) {
                particles.splice(cIndex, 1);
                particles.splice(dIndex > cIndex ? dIndex - 1 : dIndex, 1);
                createParticle('A');
                createParticle('B');
                createParticle('B'); // Extra B for stoichiometry
            }
        }
    } else {
        // Convert A and 2B to C and D (fewer moles)
        for (let i = 0; i < particlesToConvert; i++) {
            const aIndex = particles.findIndex(p => p.type === 'A');
            const bIndices = particles.reduce((indices, p, index) => {
                if (p.type === 'B') indices.push(index);
                return indices;
            }, []);
            
            if (aIndex !== -1 && bIndices.length >= 2) {
                particles.splice(aIndex, 1);
                // Remove 2 B particles, accounting for shifting indices
                particles.splice(bIndices[1] > aIndex ? bIndices[1] - 1 : bIndices[1], 1);
                particles.splice(bIndices[0] > aIndex ? 
                    (bIndices[0] > bIndices[1] ? bIndices[0] - 2 : bIndices[0] - 1) : 
                    bIndices[0], 1);
                createParticle('C');
                createParticle('D');
            }
        }
    }
    
    updateEquilibriumState();
    updateConcentrationBars();
}

// Add inert gas to the system
function addInertGas() {
    // Add 5 inert gas particles
    for (let i = 0; i < 5; i++) {
        createParticle('inert');
    }
    
    // Inert gas doesn't affect equilibrium at constant volume
    updateDataDisplay();
}

// Toggle catalyst presence
function toggleCatalyst() {
    equilibriumState.catalystPresent = !equilibriumState.catalystPresent;
    
    if (equilibriumState.catalystPresent) {
        catalystToggle.textContent = 'Remove Catalyst';
        catalystToggle.classList.add('active');
        // Increase particle speed to simulate faster reaction
        particles.forEach(p => {
            if (p.type !== 'inert') {
                p.vx *= 2;
                p.vy *= 2;
            }
        });
    } else {
        catalystToggle.textContent = 'Add Catalyst';
        catalystToggle.classList.remove('active');
        // Decrease particle speed
        particles.forEach(p => {
            if (p.type !== 'inert') {
                p.vx /= 2;
                p.vy /= 2;
            }
        });
    }
    
    updateDataDisplay();
}

// Update concentration bars based on current particles
function updateConcentrationBars() {
    // Count particles of each type
    const counts = particles.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
    }, {});
    
    // Update concentration bars
    const totalParticles = particles.length;
    const levelA = document.getElementById('level-a');
    const levelB = document.getElementById('level-b');
    const levelC = document.getElementById('level-c');
    
    if (levelA) levelA.style.width = `${(counts.A || 0) / totalParticles * 100}%`;
    if (levelB) levelB.style.width = `${(counts.B || 0) / totalParticles * 100}%`;
    if (levelC) levelC.style.width = `${(counts.C || 0) / totalParticles * 100}%`;
}

// Update equilibrium state based on current particles
function updateEquilibriumState() {
    // Count particles of each type
    const counts = particles.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
    }, {});
    
    // Update concentrations
    equilibriumState.concentrationA = (counts.A || 0) / 10;
    equilibriumState.concentrationB = (counts.B || 0) / 10;
    equilibriumState.concentrationC = (counts.C || 0) / 10;
    
    // Calculate Q value
    if (activeTab === 'pressure') {
        // For A + 2B ⇌ C + D
        equilibriumState.qValue = 
            ((counts.C || 0) * (counts.D || 0)) / 
            ((counts.A || 0) * Math.pow((counts.B || 0), 2));
    } else {
        // For A + B ⇌ C
        equilibriumState.qValue = 
            (counts.C || 0) / 
            ((counts.A || 0) * (counts.B || 0));
    }
    
    // Calculate K value based on temperature (for exothermic reaction)
    if (activeTab === 'temperature') {
        // K decreases with increasing temperature for exothermic reactions
        equilibriumState.kValue = 1.0 * Math.exp((50 - equilibriumState.temperature) / 25);
    } else {
        equilibriumState.kValue = 1.0;
    }
}

// Update shift direction based on Q and K
function updateShiftDirection() {
    if (equilibriumState.qValue > equilibriumState.kValue) {
        equilibriumState.shiftDirection = 'Left (toward reactants)';
    } else if (equilibriumState.qValue < equilibriumState.kValue) {
        equilibriumState.shiftDirection = 'Right (toward products)';
    } else {
        equilibriumState.shiftDirection = 'None (at equilibrium)';
    }
    
    document.getElementById('shift-direction').textContent = equilibriumState.shiftDirection;
}

// Update data display with current values
function updateDataDisplay() {
    // Update concentration values
    document.getElementById('conc-a').textContent = equilibriumState.concentrationA.toFixed(2);
    document.getElementById('conc-b').textContent = equilibriumState.concentrationB.toFixed(2);
    document.getElementById('conc-c').textContent = equilibriumState.concentrationC.toFixed(2);
    
    // Update equilibrium data
    document.getElementById('k-value').textContent = equilibriumState.kValue.toFixed(2);
    document.getElementById('q-value').textContent = equilibriumState.qValue.toFixed(2);
    
    updateShiftDirection();
}

// Reset the simulation to initial state
function resetSimulation() {
    // Reset equilibrium state
    equilibriumState = {
        concentrationA: 1.0,
        concentrationB: 1.0,
        concentrationC: 1.0,
        temperature: 25,
        pressure: 1.0,
        catalystPresent: false,
        kValue: 1.0,
        qValue: 1.0,
        shiftDirection: 'None'
    };
    
    // Reset controls
    temperatureSlider.value = 50;
    document.getElementById('temperature-value').textContent = '25°C';
    
    pressureSlider.value = 50;
    document.getElementById('pressure-value').textContent = '1.0 atm';
    
    catalystToggle.textContent = 'Add Catalyst';
    catalystToggle.classList.remove('active');
    
    // Reset canvas transform
    canvas.style.transform = 'scale(1)';
    
    // Create new particles
    createInitialParticles();
    
    // Update display
    updateDataDisplay();
}

// Start challenge mode
function startChallenge() {
    const challengeDescription = document.getElementById('challenge-description');
    const challengeQuestion = document.getElementById('challenge-question');
    const challengeOptions = document.getElementById('challenge-options');
    const challengeFeedback = document.getElementById('challenge-feedback');
    
    // Show challenge elements
    challengeDescription.classList.remove('hidden');
    challengeQuestion.classList.remove('hidden');
    challengeOptions.classList.remove('hidden');
    
    // Hide feedback
    challengeFeedback.classList.add('hidden');
    
    // Generate random challenge
    const challenges = [
        {
            question: "If you add more reactant A to a system at equilibrium, what will happen?",
            options: [
                "Equilibrium shifts right (toward products)",
                "Equilibrium shifts left (toward reactants)",
                "Equilibrium position doesn't change",
                "Reaction rate decreases"
            ],
            answer: 0
        },
        {
            question: "For an exothermic reaction, what happens when you increase the temperature?",
            options: [
                "Equilibrium shifts right (toward products)",
                "Equilibrium shifts left (toward reactants)",
                "Equilibrium position doesn't change",
                "More heat is produced"
            ],
            answer: 1
        },
        {
            question: "What effect does a catalyst have on the position of equilibrium?",
            options: [
                "Shifts equilibrium right (toward products)",
                "Shifts equilibrium left (toward reactants)",
                "No effect on equilibrium position",
                "Prevents the reaction from reaching equilibrium"
            ],
            answer: 2
        }
    ];
    
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    // Display challenge
    challengeQuestion.textContent = randomChallenge.question;
    
    // Create option buttons
    challengeOptions.innerHTML = '';
    randomChallenge.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('control-button');
        button.style.display = 'block';
        button.style.width = '100%';
        button.style.margin = '10px 0';
        button.style.textAlign = 'left';
        button.style.padding = '10px';
        
        button.addEventListener('click', () => {
            // Check answer
            if (index === randomChallenge.answer) {
                challengeFeedback.textContent = "Correct! That's the right application of Le Chatelier's Principle.";
                challengeFeedback.style.color = '#27ae60';
            } else {
                challengeFeedback.textContent = "Not quite. Review Le Chatelier's Principle and try again.";
                challengeFeedback.style.color = '#e74c3c';
            }
            challengeFeedback.classList.remove('hidden');
        });
        
        challengeOptions.appendChild(button);
    });
    
    // Change button text
    challengeButton.textContent = 'New Challenge';
}

// Animate the simulation
function animateSimulation() {
    if (!simulationRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update particle positions
    updateParticles();
    
    // Draw particles
    drawParticles();
    
    // Process reactions
    processReactions();
    
    // Request next frame
    requestAnimationFrame(animateSimulation);
}

// Update particle positions
function updateParticles() {
    particles.forEach(particle => {
        // Update position
        particle.x += particle.vx * animationSpeed;
        particle.y += particle.vy * animationSpeed;
        
        // Bounce off walls
        if (particle.x - particle.radius < 0 || particle.x + particle.radius > canvas.width) {
            particle.vx = -particle.vx;
        }
        if (particle.y - particle.radius < 0 || particle.y + particle.radius > canvas.height) {
            particle.vy = -particle.vy;
        }
        
        // Keep particles in bounds
        particle.x = Math.max(particle.radius, Math.min(canvas.width - particle.radius, particle.x));
        particle.y = Math.max(particle.radius, Math.min(canvas.height - particle.radius, particle.y));
    });
}

// Draw particles on canvas
function drawParticles() {
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        // Draw particle type label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(particle.type, particle.x, particle.y);
    });
}

// Process reactions between particles
function processReactions() {
    // Skip if not enough particles
    if (particles.length < 3) return;
    
    // Determine reaction rate based on temperature and catalyst
    let reactionRate = REACTION_RATE_BASE * animationSpeed;
    
    if (equilibriumState.catalystPresent) {
        reactionRate *= 3; // Catalyst speeds up reaction
    }
    
    if (activeTab === 'temperature') {
        // Higher temperature increases reaction rate
        reactionRate *= 1 + (equilibriumState.temperature - 25) / 50;
    }
    
    // Process forward reaction (A + B → C)
    if (Math.random() < reactionRate) {
        processForwardReaction();
    }
    
    // Process reverse reaction (C → A + B)
    if (Math.random() < reactionRate) {
        processReverseReaction();
    }
}

// Process forward reaction (A + B → C)
function processForwardReaction() {
    if (activeTab === 'pressure') {
        // A + 2B → C + D
        const aParticles = particles.filter(p => p.type === 'A');
        const bParticles = particles.filter(p => p.type === 'B');
        
        if (aParticles.length > 0 && bParticles.length >= 2) {
            // Find particles close to each other
            for (let a of aParticles) {
                const nearbyBs = bParticles.filter(b => 
                    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)) < 3 * PARTICLE_RADIUS
                );
                
                if (nearbyBs.length >= 2) {
                    // Remove reactants
                    const aIndex = particles.findIndex(p => p === a);
                    particles.splice(aIndex, 1);
                    
                    const b1Index = particles.findIndex(p => p === nearbyBs[0]);
                    particles.splice(b1Index > aIndex ? b1Index - 1 : b1Index, 1);
                    
                    const b2Index = particles.findIndex(p => p === nearbyBs[1]);
                    const adjustedB2Index = b2Index > aIndex ? 
                        (b2Index > b1Index ? b2Index - 2 : b2Index - 1) : 
                        (b2Index > b1Index ? b2Index - 1 : b2Index);
                    particles.splice(adjustedB2Index, 1);
                    
                    // Create products at average position
                    const avgX = (a.x + nearbyBs[0].x + nearbyBs[1].x) / 3;
                    const avgY = (a.y + nearbyBs[0].y + nearbyBs[1].y) / 3;
                    
                    particles.push({
                        type: 'C',
                        x: avgX,
                        y: avgY,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: PARTICLE_RADIUS,
                        color: PARTICLE_COLORS.C
                    });
                    
                    particles.push({
                        type: 'D',
                        x: avgX + PARTICLE_RADIUS,
                        y: avgY + PARTICLE_RADIUS,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: PARTICLE_RADIUS,
                        color: PARTICLE_COLORS.D
                    });
                    
                    updateEquilibriumState();
                    updateConcentrationBars();
                    updateDataDisplay();
                    break;
                }
            }
        }
    } else {
        // A + B → C
        const aParticles = particles.filter(p => p.type === 'A');
        const bParticles = particles.filter(p => p.type === 'B');
        
        if (aParticles.length > 0 && bParticles.length > 0) {
            // Find particles close to each other
            for (let a of aParticles) {
                const nearbyB = bParticles.find(b => 
                    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)) < 3 * PARTICLE_RADIUS
                );
                
                if (nearbyB) {
                    // Remove reactants
                    const aIndex = particles.findIndex(p => p === a);
                    const bIndex = particles.findIndex(p => p === nearbyB);
                    
                    particles.splice(Math.max(aIndex, bIndex), 1);
                    particles.splice(Math.min(aIndex, bIndex), 1);
                    
                    // Create product at average position
                    const avgX = (a.x + nearbyB.x) / 2;
                    const avgY = (a.y + nearbyB.y) / 2;
                    
                    particles.push({
                        type: 'C',
                        x: avgX,
                        y: avgY,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: PARTICLE_RADIUS,
                        color: PARTICLE_COLORS.C
                    });
                    
                    updateEquilibriumState();
                    updateConcentrationBars();
                    updateDataDisplay();
                    break;
                }
            }
        }
    }
}

// Process reverse reaction (C → A + B)
function processReverseReaction() {
    if (activeTab === 'pressure') {
        // C + D → A + 2B
        const cParticles = particles.filter(p => p.type === 'C');
        const dParticles = particles.filter(p => p.type === 'D');
        
        if (cParticles.length > 0 && dParticles.length > 0) {
            // Find particles close to each other
            for (let c of cParticles) {
                const nearbyD = dParticles.find(d => 
                    Math.sqrt(Math.pow(c.x - d.x, 2) + Math.pow(c.y - d.y, 2)) < 3 * PARTICLE_RADIUS
                );
                
                if (nearbyD) {
                    // Remove products
                    const cIndex = particles.findIndex(p => p === c);
                    const dIndex = particles.findIndex(p => p === nearbyD);
                    
                    particles.splice(Math.max(cIndex, dIndex), 1);
                    particles.splice(Math.min(cIndex, dIndex), 1);
                    
                    // Create reactants at average position
                    const avgX = (c.x + nearbyD.x) / 2;
                    const avgY = (c.y + nearbyD.y) / 2;
                    
                    particles.push({
                        type: 'A',
                        x: avgX,
                        y: avgY,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: PARTICLE_RADIUS,
                        color: PARTICLE_COLORS.A
                    });
                    
                    particles.push({
                        type: 'B',
                        x: avgX + PARTICLE_RADIUS,
                        y: avgY + PARTICLE_RADIUS,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: PARTICLE_RADIUS,
                        color: PARTICLE_COLORS.B
                    });
                    
                    particles.push({
                        type: 'B',
                        x: avgX - PARTICLE_RADIUS,
                        y: avgY - PARTICLE_RADIUS,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        radius: PARTICLE_RADIUS,
                        color: PARTICLE_COLORS.B
                    });
                    
                    updateEquilibriumState();
                    updateConcentrationBars();
                    updateDataDisplay();
                    break;
                }
            }
        }
    } else {
        // C → A + B
        const cParticles = particles.filter(p => p.type === 'C');
        
        if (cParticles.length > 0) {
            // Randomly select a C particle
            const randomIndex = Math.floor(Math.random() * cParticles.length);
            const c = cParticles[randomIndex];
            
            // Remove product
            const cIndex = particles.findIndex(p => p === c);
            particles.splice(cIndex, 1);
            
            // Create reactants at same position
            particles.push({
                type: 'A',
                x: c.x - PARTICLE_RADIUS,
                y: c.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: PARTICLE_RADIUS,
                color: PARTICLE_COLORS.A
            });
            
            particles.push({
                type: 'B',
                x: c.x + PARTICLE_RADIUS,
                y: c.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: PARTICLE_RADIUS,
                color: PARTICLE_COLORS.B
            });
            
            updateEquilibriumState();
            updateConcentrationBars();
            updateDataDisplay();
        }
    }
}

// Initialize the simulation when the page loads
window.addEventListener('load', initSimulation);
