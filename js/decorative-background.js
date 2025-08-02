/* =================================================================
   SOFUN TRACKER - DECORATIVE BACKGROUND
   Inspired by Tympanus WebGL Backgrounds Demo 5
   Simplified canvas-based geometric animation for military applications
   ================================================================= */

/**
 * Decorative Background System
 * Creates animated geometric particles with clean, professional aesthetics
 */
class DecorativeBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.time = 0;
        
        // Performance detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isLowPerformance = this.isMobile || navigator.hardwareConcurrency < 4;
        
        // Configuration (adaptive based on device performance)
        this.config = {
            particleCount: this.isLowPerformance ? 25 : 50,
            maxSize: this.isMobile ? 3 : 4,
            minSize: 1,
            speed: 0.5,
            connectionDistance: this.isLowPerformance ? 100 : 150,
            mouseInfluence: this.isMobile ? 50 : 100,
            frameSkip: this.isLowPerformance ? 2 : 1, // Skip frames for better performance
            colors: {
                primary: 'rgba(79, 172, 254, 0.6)',
                secondary: 'rgba(118, 75, 162, 0.4)',
                accent: 'rgba(0, 242, 254, 0.3)',
                connection: 'rgba(79, 172, 254, 0.1)'
            }
        };
        
        this.frameCount = 0;
        
        this.init();
    }

    /**
     * Initialize the background system
     */
    init() {
        this.resize();
        this.createParticles();
        this.setupEventListeners();
        this.animate();
    }

    /**
     * Setup canvas size and handle responsive design
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Create particle system
     */
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * this.config.speed,
                vy: (Math.random() - 0.5) * this.config.speed,
                size: Math.random() * (this.config.maxSize - this.config.minSize) + this.config.minSize,
                opacity: Math.random() * 0.5 + 0.3,
                angle: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.02,
                color: this.getRandomColor(),
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    /**
     * Get random color from palette (adapts to dark mode)
     */
    getRandomColor() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        const lightColors = Object.values(this.config.colors);
        const darkColors = {
            primary: 'rgba(79, 172, 254, 0.8)',
            secondary: 'rgba(118, 75, 162, 0.6)',
            accent: 'rgba(0, 242, 254, 0.5)',
            connection: 'rgba(79, 172, 254, 0.2)'
        };
        
        const colors = isDarkMode ? Object.values(darkColors) : lightColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mouse movement interaction
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // Resize handling
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        // Touch support for mobile
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouseX = touch.clientX - rect.left;
            this.mouseY = touch.clientY - rect.top;
        });
    }

    /**
     * Update particle positions and properties
     */
    updateParticles() {
        this.time += 0.016; // ~60fps

        this.particles.forEach((particle, index) => {
            // Mouse interaction
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.config.mouseInfluence) {
                const force = (this.config.mouseInfluence - distance) / this.config.mouseInfluence;
                particle.vx += dx * force * 0.01;
                particle.vy += dy * force * 0.01;
            }

            // Apply velocity with dampening
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Boundary wrapping
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;

            // Rotation and pulsing
            particle.angle += particle.rotationSpeed;
            particle.pulsePhase += 0.02;
            
            // Add subtle floating motion
            particle.x += Math.sin(this.time + index) * 0.2;
            particle.y += Math.cos(this.time + index * 0.7) * 0.2;
        });
    }

    /**
     * Draw connections between nearby particles
     */
    drawConnections() {
        this.ctx.strokeStyle = this.config.colors.connection;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.config.connectionDistance) {
                    const opacity = 1 - (distance / this.config.connectionDistance);
                    this.ctx.globalAlpha = opacity * 0.3;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw individual particles
     */
    drawParticles() {
        this.particles.forEach(particle => {
            const pulse = Math.sin(particle.pulsePhase) * 0.3 + 0.7;
            const size = particle.size * pulse;
            
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.angle);
            this.ctx.globalAlpha = particle.opacity * pulse;
            
            // Draw geometric shape (hexagon for military aesthetic)
            this.ctx.beginPath();
            this.ctx.fillStyle = particle.color;
            
            const sides = 6;
            const angle = (Math.PI * 2) / sides;
            
            this.ctx.moveTo(size, 0);
            for (let i = 1; i < sides; i++) {
                const x = Math.cos(angle * i) * size;
                const y = Math.sin(angle * i) * size;
                this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            
            // Add subtle glow effect
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = size * 2;
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    /**
     * Clear canvas with gradient background
     */
    clearCanvas() {
        // Create subtle gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.02)');
        gradient.addColorStop(0.5, 'rgba(118, 75, 162, 0.03)');
        gradient.addColorStop(1, 'rgba(79, 172, 254, 0.02)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Main animation loop with performance optimization
     */
    animate() {
        this.frameCount++;
        
        // Skip frames on low-performance devices
        if (this.frameCount % this.config.frameSkip === 0) {
            this.clearCanvas();
            this.updateParticles();
            
            // Draw connections less frequently for better performance
            if (this.frameCount % (this.config.frameSkip * 2) === 0) {
                this.drawConnections();
            }
            
            this.drawParticles();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Stop the animation
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.resize);
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.createParticles();
    }
}

/* ---------- Auto-initialization ---------- */

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const backgroundCanvas = document.getElementById('decorative-background');
    if (backgroundCanvas) {
        window.decorativeBackground = new DecorativeBackground('decorative-background');
        console.log('✅ Decorative background initialized');
    }
});

// Global function for manual initialization
function initDecorativeBackground(canvasId = 'decorative-background') {
    if (window.decorativeBackground) {
        window.decorativeBackground.destroy();
    }
    window.decorativeBackground = new DecorativeBackground(canvasId);
    return window.decorativeBackground;
}

console.log('✅ Decorative Background System loaded');