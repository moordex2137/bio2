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
    if (data.activities && data.activities.length > 0) {
        activities = data.activities;
        updateActivityDisplay();
    } else {
        const activityContainer = document.querySelector('.activity-container');
        if (activityContainer) {
            activityContainer.style.display = 'none';
        }
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
    const activityContainer = document.querySelector('.activity-container');
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
    const items = wrapper.querySelectorAll('.tooltip-wrapper');
    const totalGroups = Math.ceil(items.length / itemsPerGroup);

    // Update current group with bounds checking
    currentGroup = Math.max(0, Math.min(totalGroups - 1, currentGroup + direction));
    
    // Calculate the width of one group (including gaps)
    const itemWidth = 40; // Item width
    const gapWidth = 8;  // Gap width
    const groupWidth = (itemWidth * itemsPerGroup) + (gapWidth * (itemsPerGroup - 1));
    
    // Apply the transform
    wrapper.style.transform = `translateX(-${currentGroup * groupWidth}px)`;

    // Update button visibility
    updateNavButtonsVisibility();
}

function updateNavButtonsVisibility() {
    const wrapper = document.querySelector('.social-links-wrapper');
    const items = wrapper.querySelectorAll('.tooltip-wrapper');
    const totalGroups = Math.ceil(items.length / itemsPerGroup);
    
    const leftNav = document.querySelector('.left-nav');
    const rightNav = document.querySelector('.right-nav');

    // Show/hide left button
    leftNav.style.opacity = currentGroup > 0 ? '1' : '0.5';
    leftNav.style.pointerEvents = currentGroup > 0 ? 'auto' : 'none';
    
    // Show/hide right button
    rightNav.style.opacity = currentGroup < totalGroups - 1 ? '1' : '0.5';
    rightNav.style.pointerEvents = currentGroup < totalGroups - 1 ? 'auto' : 'none';
}

// Initialize button visibility and click handlers
document.addEventListener('DOMContentLoaded', () => {
    updateNavButtonsVisibility();
    
    // Update click handlers
    document.querySelector('.left-nav').addEventListener('click', () => scrollSocialLinks(-1));
    document.querySelector('.right-nav').addEventListener('click', () => scrollSocialLinks(1));
}); 