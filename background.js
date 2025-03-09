function createPetal() {
    const petal = document.createElement('div');
    petal.className = 'petal';
    
    // Random size between 4px and 12px (slightly smaller for more petals)
    const size = Math.random() * 8 + 4;
    petal.style.width = `${size}px`;
    petal.style.height = `${size}px`;
    
    // Random starting position anywhere on screen
    const startPosition = {
        x: Math.random() * 100,
        y: Math.random() * 100
    };
    
    // Random ending position anywhere on screen
    const endPosition = {
        x: Math.random() * 100,
        y: Math.random() * 100
    };
    
    petal.style.left = `${startPosition.x}%`;
    petal.style.top = `${startPosition.y}%`;
    
    // Random animation duration between 3s and 8s
    const duration = Math.random() * 5 + 3;
    petal.style.animation = `randomFloat ${duration}s linear infinite`;
    
    // Set custom properties for animation
    petal.style.setProperty('--end-x', `${endPosition.x}%`);
    petal.style.setProperty('--end-y', `${endPosition.y}%`);
    
    document.querySelector('.cherry-blossom').appendChild(petal);
    
    // Remove petal after animation
    setTimeout(() => {
        petal.remove();
    }, duration * 1000);
}

// Create new petals periodically
function startPetalAnimation() {
    // Create new petals more frequently (every 100ms instead of 300ms)
    setInterval(createPetal, 100);
    
    // Create more initial petals (40 instead of 15)
    for(let i = 0; i < 40; i++) {
        createPetal();
    }
}

// Start animation when page loads
document.addEventListener('DOMContentLoaded', startPetalAnimation); 