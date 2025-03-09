async function updateBanner() {
    try {
        // Fetch banner data from database
        const response = await fetch('https://ep-winter-heart-a9nnglpk-pooler.gwc.azure.neon.tech/neondb/user_banner');
        const data = await response.json();
        
        // Get banner element
        const bannerElement = document.querySelector('.banner-background');
        
        if (data && bannerElement) {
            if (data.banner_url) {
                bannerElement.style.backgroundImage = `url('${data.banner_url}')`;
            } else if (data.banner_color) {
                bannerElement.style.background = `linear-gradient(to bottom, ${data.banner_color}40 0%, transparent 100%)`;
            }
        }
    } catch (error) {
        console.error('Error loading banner:', error);
    }
}

// Update banner when page loads
document.addEventListener('DOMContentLoaded', updateBanner);

// Update banner every 5 minutes
setInterval(updateBanner, 300000); 