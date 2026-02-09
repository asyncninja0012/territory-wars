class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Low volume by default
        this.masterGain.connect(this.ctx.destination);
    }

    playTone(freq, type, duration, startTime = 0) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playCapture() {
        // High pitched "ding"
        this.playTone(800, 'sine', 0.1);
        this.playTone(1200, 'sine', 0.1, 0.05);
    }

    playError() {
        // Low buzzing "error"
        this.playTone(150, 'sawtooth', 0.2);
    }

    playEvent() {
        // Sci-fi "alarm"
        this.playTone(400, 'square', 0.1);
        this.playTone(400, 'square', 0.1, 0.15);
        this.playTone(400, 'square', 0.1, 0.3);
    }

    playGameOver() {
        // Sad melody
        this.playTone(400, 'triangle', 0.4, 0);
        this.playTone(300, 'triangle', 0.4, 0.4);
        this.playTone(200, 'triangle', 0.8, 0.8);
    }
}

export const soundManager = new SoundManager();
