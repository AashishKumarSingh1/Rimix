let alarmInstance: any = null;

if (typeof window !== 'undefined') {
  import('./alarm').then((module) => {
    alarmInstance = module.alarmInstance;
  });
}

export function startAlarm(onClose?: () => void) {
  if (alarmInstance) {
    alarmInstance.start(onClose);
  }
}

export function cleanupAlarm() {
  if (alarmInstance) {
    alarmInstance.cleanup();
  }
}