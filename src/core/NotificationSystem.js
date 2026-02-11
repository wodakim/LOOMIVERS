
export class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.position = 'absolute';
        this.container.style.top = '100px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '10px';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        // Style based on type
        const color = type === 'unlock' ? '#ffd700' : (type === 'achievement' ? '#ff00ff' : '#00ccff');
        toast.style.background = 'rgba(0, 0, 0, 0.8)';
        toast.style.border = `2px solid ${color}`;
        toast.style.color = '#fff';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '5px';
        toast.style.fontFamily = 'monospace';
        toast.style.fontSize = '16px';
        toast.style.textShadow = `0 0 5px ${color}`;
        toast.style.animation = 'slideDown 0.5s ease-out, fadeOut 0.5s ease-in 2.5s forwards';

        this.container.appendChild(toast);

        // Remove after animation
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Add CSS animation
const style = document.createElement('style');
style.innerHTML = `
@keyframes slideDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}
`;
document.head.appendChild(style);
