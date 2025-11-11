interface SpeechData {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface IWindow extends Window {
  webkitSpeechRecognition: new () => SpeechRecognition;
}

declare const window: IWindow;

export function startVoiceRecognition(): Promise<SpeechData> {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported in this browser. Please use Chrome.'));
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let transcript = '';

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      transcript = event.results[0][0].transcript;
      console.log('Recognized text:', transcript);
      const data = extractReminderInfo(transcript);
      resolve(data);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      if (!transcript) {
        reject(new Error('No speech was detected. Please try again.'));
      }
    };

    try {
      recognition.start();
    } catch {
      reject(new Error('Failed to start speech recognition. Please try again.'));
    }
  });
}

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseRelativeDate(dateStr: string): Date | null {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (dateStr.toLowerCase() === 'today') {
    return today;
  } else if (dateStr.toLowerCase() === 'tomorrow') {
    return tomorrow;
  }

  const nextMatch = dateStr.match(/next\s+(\w+)/i);
  if (nextMatch) {
    const unit = nextMatch[1].toLowerCase();
    const date = new Date(today);
    
    switch (unit) {
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return null;
    }
    return date;
  }

  return null;
}

function parseTime12to24(timeStr: string): string | null {
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!match) return null;

  const [, hours, minutes, meridian] = match;
  let hour = parseInt(hours, 10);
  
  if (meridian.toLowerCase() === 'pm' && hour !== 12) {
    hour += 12;
  } else if (meridian.toLowerCase() === 'am' && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, '0')}:${minutes ? minutes : '00'}`;
}

function extractReminderInfo(text: string): SpeechData {
  const data: SpeechData = {};
  
  const titleMatch = text.match(/^[^.!?]*[.!?]/);
  if (titleMatch) {
    data.title = titleMatch[0].trim();
    text = text.replace(titleMatch[0], '').trim();
  } else {
    data.title = text;
    text = '';
  }

  const datePatterns = [
    /(?:on|for|due|by)\s+(tomorrow|today|next\s+(?:week|month|year)|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+\d{4})?)/i,
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[1] || match[0];

      const relativeDate = parseRelativeDate(dateStr);
      if (relativeDate) {
        data.date = formatDateToISO(relativeDate);
        text = text.replace(match[0], '').trim();
        break;
      }

      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          data.date = formatDateToISO(date);
          text = text.replace(match[0], '').trim();
          break;
        }
      } catch {
      }
    }
  }

  const timePatterns = [
    /(?:at|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i,
    /(\d{1,2}:\d{2})/
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      const timeStr = match[1];
      
      const time24 = parseTime12to24(timeStr);
      if (time24) {
        data.time = time24;
        text = text.replace(match[0], '').trim();
        break;
      }

      if (timeStr.match(/^\d{2}:\d{2}$/)) {
        data.time = timeStr;
        text = text.replace(match[0], '').trim();
        break;
      }
    }
  }

  const priorityMatch = text.match(/\b(high|medium|low)(?:\s+priority)?\b/i);
  if (priorityMatch) {
    data.priority = priorityMatch[1].toLowerCase() as 'high' | 'medium' | 'low';
    text = text.replace(priorityMatch[0], '').trim();
  }

  const categories = ['Work', 'Personal', 'Health', 'Finance', 'Other'];
  const categoryPattern = new RegExp(`\\b(${categories.join('|')})\\b`, 'i');
  const categoryMatch = text.match(categoryPattern);
  if (categoryMatch) {
    data.category = categoryMatch[1];
    text = text.replace(categoryMatch[0], '').trim();
  }

  if (text.trim()) {
    data.description = text.trim();
  }

  return data;
}