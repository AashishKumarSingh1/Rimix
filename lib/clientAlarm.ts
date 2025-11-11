type AlarmShape = {
  start?: (onClose?: () => void) => void;
  cleanup?: () => void;
  isActive?: () => boolean;
} | null;

let alarmInstance: AlarmShape = null;

if (typeof window !== 'undefined') {
  import('./alarm').then((module) => {
    alarmInstance = module.alarmInstance as AlarmShape;
  });
}

export function startAlarm(onClose?: () => void) {
  if (alarmInstance?.start) {
    alarmInstance.start(onClose);
  }
}

export function cleanupAlarm() {
  if (alarmInstance?.cleanup) {
    alarmInstance.cleanup();
  }
}