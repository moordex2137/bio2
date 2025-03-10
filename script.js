const DISCORD_ID = '525363740347072552';
let activities = [];
let currentActivityIndex = 0;

// Connect to Lanyard WebSocket
const ws = new WebSocket('wss://api.lanyard.rest/socket');
let interval = null;

ws.onopen = () => {
    ws.send(JSON.stringify({
        op: 2,
        d: {
            subscribe_to_id: DISCORD_ID
        }
    }));

    interval = setInterval(() => {
        ws.send(JSON.stringify({
            op: 3
        }));
    }, 30000);
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.op === 1) {
        ws.send(JSON.stringify({
            op: 2,
            d: {
                subscribe_to_id: DISCORD_ID
            }
        }));
    }

    if (data.op !== 0) return;

    updateProfile(data.d);
};

ws.onclose = () => {
    if (interval) clearInterval(interval);
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

function updateProfile(data) {
    // Update avatar
    if (data.discord_user) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${data.discord_user.avatar}`;
        document.querySelector('.profile-img').src = avatarUrl;
        
        // Set username immediately
        document.querySelector('.username').textContent = data.discord_user.username || 'moordex';
    }

    // Update activities
    const activityContainer = document.querySelector('.activity-container');
    const discordActivity = document.querySelector('.discord-activity');
    
    if (data.activities && data.activities.length > 0) {
        activities = data.activities;
        updateActivityDisplay();
        activityContainer.style.display = 'block';
    } else {
        // Show offline message
        activityContainer.style.display = 'block';
        discordActivity.classList.remove('playing', 'streaming', 'listening', 'watching', 'competing');
        discordActivity.classList.add('offline');
        
        const activityName = document.getElementById('activity-name');
        const activityState = document.getElementById('activity-state');
        const activityImage = document.getElementById('activity-image');
        
        activityName.textContent = 'Offline';
        activityState.innerHTML = 'Obecnie brak aktywności';
        activityImage.style.display = 'none';
    }

    // Update status
    updateStatus(data.discord_status);
}

function updateStatus(status) {
    const statusDot = document.querySelector('.status-dot');
    if (statusDot) {
        statusDot.className = 'status-dot ' + status;
    }
}

function updateActivityDisplay() {
    if (activities.length === 0) return;

    const activity = activities[currentActivityIndex];
    const activityName = document.getElementById('activity-name');
    const activityState = document.getElementById('activity-state');
    const activityImage = document.getElementById('activity-image');
    const activityContainer = document.querySelector('.discord-activity');

    // Remove all activity classes
    activityContainer.classList.remove('playing', 'streaming', 'listening', 'watching', 'competing');
    
    // Add appropriate activity class
    switch (activity.type) {
        case 0:
            activityContainer.classList.add('playing');
            break;
        case 1:
            activityContainer.classList.add('streaming');
            break;
        case 2:
            activityContainer.classList.add('listening');
            break;
        case 3:
            activityContainer.classList.add('watching');
            break;
        case 5:
            activityContainer.classList.add('competing');
            break;
    }

    // Set activity name with type
    activityName.textContent = getActivityType(activity.type) + ' ' + activity.name;

    // Set activity details
    let details = [];
    if (activity.details) details.push(activity.details);
    if (activity.state) details.push(activity.state);
    activityState.innerHTML = details.join('<br>');

    // Handle activity image
    if (activity.assets) {
        let imageUrl = '';
        
        // Handle Spotify
        if (activity.type === 2 && activity.assets.large_image?.startsWith('spotify:')) {
            const spotifyImageId = activity.assets.large_image.replace('spotify:', '');
            imageUrl = `https://i.scdn.co/image/${spotifyImageId}`;
        }
        // Handle game or other activity
        else if (activity.assets.large_image) {
            if (activity.assets.large_image.startsWith('mp:')) {
                imageUrl = `https://media.discordapp.net/${activity.assets.large_image.replace('mp:', '')}`;
            } else if (activity.assets.large_image.startsWith('external/')) {
                imageUrl = `https://media.discordapp.net/${activity.assets.large_image}`;
            } else {
                imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.large_image}`;
            }
        }

        if (imageUrl) {
            activityImage.src = imageUrl;
            activityImage.style.display = 'block';
            
            // Log the image URL for debugging
            console.log('Activity image URL:', imageUrl);
            
            // Error handling for images
            activityImage.onerror = () => {
                console.log('Failed to load image:', imageUrl);
                // Try small image as fallback
                if (activity.assets.small_image) {
                    let smallImageUrl = '';
                    if (activity.assets.small_image.startsWith('mp:')) {
                        smallImageUrl = `https://media.discordapp.net/${activity.assets.small_image.replace('mp:', '')}`;
                    } else {
                        smallImageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets.small_image}`;
                    }
                    activityImage.src = smallImageUrl;
                } else {
                    activityImage.style.display = 'none';
                }
            };
        } else {
            activityImage.style.display = 'none';
        }
    } else {
        activityImage.style.display = 'none';
    }

    // Show activity container
    if (activityContainer) {
        activityContainer.style.display = 'block';
    }
}

function getActivityType(type) {
    switch (type) {
        case 0: return 'Gra w';
        case 1: return 'Streamuje';
        case 2: return 'Słucha';
        case 3: return 'Ogląda';
        case 4: return 'Custom';
        case 5: return 'Konkuruje w';
        default: return '';
    }
}

function nextActivity() {
    if (activities.length <= 1) return;
    currentActivityIndex = (currentActivityIndex + 1) % activities.length;
    updateActivityDisplay();
}

function previousActivity() {
    if (activities.length <= 1) return;
    currentActivityIndex = (currentActivityIndex - 1 + activities.length) % activities.length;
    updateActivityDisplay();
}

// Add event listeners for the arrows
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('prev-activity').addEventListener('click', () => {
        if (activities.length > 0) {
            currentActivityIndex = (currentActivityIndex - 1 + activities.length) % activities.length;
            updateActivityDisplay();
        }
    });

    document.getElementById('next-activity').addEventListener('click', () => {
        if (activities.length > 0) {
            currentActivityIndex = (currentActivityIndex + 1) % activities.length;
            updateActivityDisplay();
        }
    });

    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(element => {
        element.textContent = 'Ładowanie...';
    });
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Fallback to REST API if WebSocket fails
ws.onerror = () => {
    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateProfile(data.data);
            }
        })
        .catch(console.error);
};

// Social links navigation
let currentGroup = 0;
const itemsPerGroup = 5;

function scrollSocialLinks(direction) {
    const wrapper = document.querySelector('.social-links-wrapper');
    const container = document.querySelector('.social-links');
    const items = wrapper.querySelectorAll('.tooltip-wrapper');
    const itemWidth = 48; // 40px width + 8px gap
    const containerWidth = container.offsetWidth;
    const totalWidth = items.length * itemWidth;
    
    // Calculate maximum scroll distance to show last items perfectly
    const maxScroll = Math.max(0, totalWidth - containerWidth);
    
    // Calculate the scroll amount based on container width
    const currentScroll = Math.abs(parseInt(wrapper.style.transform?.split('translateX(')[1]) || 0);
    let newScroll = currentScroll + (direction * containerWidth);
    
    // If scrolling right and would show empty space, snap to end
    if (direction > 0 && newScroll + containerWidth > totalWidth) {
        newScroll = maxScroll;
    }
    
    // Ensure we don't scroll past the bounds
    newScroll = Math.max(0, Math.min(maxScroll, newScroll));
    
    // Apply the transform
    wrapper.style.transform = `translateX(-${newScroll}px)`;

    // Update button visibility
    updateNavButtonsVisibility();
}

function updateNavButtonsVisibility() {
    const wrapper = document.querySelector('.social-links-wrapper');
    const container = document.querySelector('.social-links');
    const items = wrapper.querySelectorAll('.tooltip-wrapper');
    const itemWidth = 48; // 40px width + 8px gap
    const totalWidth = items.length * itemWidth;
    const currentScroll = Math.abs(parseInt(wrapper.style.transform?.split('translateX(')[1]) || 0);
    const maxScroll = Math.max(0, totalWidth - container.offsetWidth);
    
    const leftNav = document.querySelector('.left-nav');
    const rightNav = document.querySelector('.right-nav');

    // Show/hide left button
    leftNav.style.opacity = currentScroll > 0 ? '1' : '0.5';
    leftNav.style.pointerEvents = currentScroll > 0 ? 'auto' : 'none';
    
    // Show/hide right button
    rightNav.style.opacity = currentScroll < maxScroll ? '1' : '0.5';
    rightNav.style.pointerEvents = currentScroll < maxScroll ? 'auto' : 'none';
}

// Initialize button visibility and click handlers
document.addEventListener('DOMContentLoaded', () => {
    updateNavButtonsVisibility();
    
    // Update click handlers
    document.querySelector('.left-nav').addEventListener('click', () => scrollSocialLinks(-1));
    document.querySelector('.right-nav').addEventListener('click', () => scrollSocialLinks(1));
});

// Add Netlify badge toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.querySelector('.netlify-toggle');
    const netlifyBadge = document.querySelector('.netlify-badge');
    
    toggleButton.addEventListener('click', () => {
        netlifyBadge.classList.toggle('show');
    });
}); 