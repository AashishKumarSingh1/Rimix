interface Spot {
  x: number;
  y: number;
  element?: HTMLDivElement;
}

interface AudioContextWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

class AudioAlarm {
  private context: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private modulationInterval?: number;
  private isPlaying = false;
  private spots: Spot[] = [];
  private onClose?: () => void;
  private spotStyle?: HTMLStyleElement;
  private clickedSpots = new Set<number>();

  constructor() {
    this.initAudioContext();
    this.createSpotStyles();
  }

  private initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as AudioContextWindow).webkitAudioContext;
      this.context = new AudioContextClass();
    } catch (error) {
      console.error('Web Audio API is not supported:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private createSpotStyles() {
    this.spotStyle = document.createElement('style');
    this.spotStyle.textContent = `
      .alarm-spot {
        position: fixed;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        transition: all 0.3s ease;
        box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
      }
      
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 15px rgba(255, 165, 0, 0.5); }
        50% { transform: scale(1.2); box-shadow: 0 0 30px rgba(255, 165, 0, 0.8); }
        100% { transform: scale(1); box-shadow: 0 0 15px rgba(255, 165, 0, 0.5); }
      }

      @keyframes wiggle {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        75% { transform: rotate(5deg); }
        100% { transform: rotate(0deg); }
      }

      .alarm-spot {
        animation: pulse 1s infinite, wiggle 0.5s infinite;
      }

      .alarm-spot.clicked {
        animation: none;
        transform: scale(1);
        background-color: rgba(0, 255, 0, 0.8) !important;
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
      }

      .alarm-notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 16px;
        z-index: 10000;
      }
    `;
    document.head.appendChild(this.spotStyle);
  }

  private showNotification(message: string) {
    const notification = document.createElement('div');
    notification.className = 'alarm-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  private createRandomSpots(): Spot[] {
    const spots: Spot[] = [];
    const padding = 100; 
    const minDistance = 100;

    for (let i = 0; i < 3; i++) {
      let spot: Spot;
      do {
        spot = {
          x: padding + Math.random() * (window.innerWidth - 2 * padding),
          y: padding + Math.random() * (window.innerHeight - 2 * padding)
        };
      } while (spots.some(existingSpot => 
        Math.hypot(existingSpot.x - spot.x, existingSpot.y - spot.y) < minDistance
      ));
      spots.push(spot);
    }

    return spots;
  }

  private createSpotElement(spot: Spot, index: number) {
    const element = document.createElement('div');
    spot.element = element;
    
    element.className = 'alarm-spot';
    element.style.left = `${spot.x}px`;
    element.style.top = `${spot.y}px`;
    element.style.backgroundColor = 'rgba(255, 165, 0, 0.8)';
    
    element.onclick = () => this.handleSpotClick(index);
    document.body.appendChild(element);
  }

  private handleSpotClick(index: number) {
    if (this.clickedSpots.has(index)) return;

    this.clickedSpots.add(index);
    const element = this.spots[index].element;
    if (element) {
      element.classList.add('clicked');
    }

    const remainingSpots = 3 - this.clickedSpots.size;
    if (remainingSpots > 0) {
      this.showNotification(`${remainingSpots} more spot${remainingSpots > 1 ? 's' : ''} to go!`);
    } else {
      this.stop();
      this.showNotification('Alarm dismissed!');
    }
  }

  private createAlarmSound() {
    if (!this.context) return;

    const mainOsc = this.context.createOscillator();
    const mainGain = this.context.createGain();
    mainOsc.type = 'triangle';
    mainOsc.frequency.value = 440;
    mainOsc.connect(mainGain);
    mainGain.connect(this.context.destination);
    mainGain.gain.value = 0.3;
    this.oscillators.push(mainOsc);
    this.gains.push(mainGain);

    const secondOsc = this.context.createOscillator();
    const secondGain = this.context.createGain();
    secondOsc.type = 'sine';
    secondOsc.frequency.value = 554.37;
    secondOsc.connect(secondGain);
    secondGain.connect(this.context.destination);
    secondGain.gain.value = 0.2;
    this.oscillators.push(secondOsc);
    this.gains.push(secondGain);

    const startTime = this.context.currentTime;
    this.oscillators.forEach(osc => osc.start(startTime));

    this.modulationInterval = window.setInterval(() => {
      if (!this.context) return;
      const now = this.context.currentTime;
      
      mainOsc.frequency.setValueCurveAtTime(
        [440, 880, 440, 880, 440],
        now,
        0.5
      );
      
      secondOsc.frequency.setValueCurveAtTime(
        [554.37, 1108.74, 554.37, 1108.74, 554.37],
        now,
        0.5
      );

      this.gains.forEach(gain => {
        gain.gain.setValueCurveAtTime(
          [0.3, 0.1, 0.3, 0.1, 0.3],
          now,
          0.5
        );
      });
    }, 500);
  }

  public start(onClose?: () => void) {
    if (this.isPlaying) return;
    
    if (!this.context) {
      this.initAudioContext();
      if (!this.context) {
        console.error('Failed to initialize audio context');
        return;
      }
    }

    this.onClose = onClose;
    this.clickedSpots.clear();

    if (this.context.state === 'suspended') {
      this.context.resume().catch(console.error);
    }

    this.createAlarmSound();

    this.spots = this.createRandomSpots();
    this.spots.forEach((spot, index) => this.createSpotElement(spot, index));

    this.isPlaying = true;
    this.showNotification('Click all 3 spots to dismiss the alarm!');
  }

  public stop() {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
      }
    });
    this.oscillators = [];

    this.gains.forEach(gain => gain.disconnect());
    this.gains = [];

    if (this.modulationInterval) {
      clearInterval(this.modulationInterval);
      this.modulationInterval = undefined;
    }

    this.spots.forEach(spot => spot.element?.remove());
    this.spots = [];
    this.clickedSpots.clear();

    this.isPlaying = false;
    if (this.onClose) this.onClose();
  }

  public isActive() {
    return this.isPlaying;
  }

  public cleanup() {
    this.stop();
    if (this.spotStyle) {
      this.spotStyle.remove();
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

export const alarmInstance = new AudioAlarm();