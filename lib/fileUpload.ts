interface ExtractedData {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}

export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        if (!e.target?.result) {
          reject(new Error('Failed to read file'));
          return;
        }

        if (typeof e.target.result !== 'string') {
          reject(new Error('Invalid file content'));
          return;
        }

        resolve(e.target.result);
      } catch (error) {
        reject(new Error('Error processing file: ' + (error instanceof Error ? error.message : 'Unknown error')));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Error reading file: ${reader.error?.message || 'Unknown error'}`));
    };

    switch (file.type) {
      case 'application/pdf':
        reject(new Error('PDF files are not supported yet. Please use text files.'));
        break;
      case 'text/plain':
      case 'text/markdown':
      case 'application/json':
      case '': 
        reader.readAsText(file);
        break;
      default:
        reject(new Error('Unsupported file type. Please use .txt files.'));
    }
  });
}

function parseDate(text: string): string | undefined {
  const patterns = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/,
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        let date: Date;
        if (match.length === 4) {
          const monthMap: { [key: string]: number } = {
            'jan': 0, 'january': 0, 'feb': 1, 'february': 1, 'mar': 2, 'march': 2,
            'apr': 3, 'april': 3, 'may': 4, 'jun': 5, 'june': 5, 'jul': 6, 'july': 6,
            'aug': 7, 'august': 7, 'sep': 8, 'september': 8, 'oct': 9, 'october': 9,
            'nov': 10, 'november': 10, 'dec': 11, 'december': 11
          };
          const month = monthMap[match[1].toLowerCase()];
          const day = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          date = new Date(year, month, day);
        } else {
          date = new Date(match[1]);
        }
        
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }

  return undefined;
}

function parseTime(text: string): string | undefined {
  const patterns = [
    /\b(\d{2}:\d{2})\b/,
    /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        if (match.length === 4) {
          let hours = parseInt(match[1], 10);
          const minutes = parseInt(match[2], 10);
          const meridian = match[3].toLowerCase();

          if (meridian === 'pm' && hours !== 12) hours += 12;
          if (meridian === 'am' && hours === 12) hours = 0;

          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
          return match[1];
        }
      } catch {
        continue;
      }
    }
  }

  return undefined;
}

export function extractReminderFromText(text: string): ExtractedData {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  
  const data: ExtractedData = {
    title: lines[0] || 'Untitled Reminder',
    description: lines.slice(1).join('\n').trim() || undefined
  };

  data.date = parseDate(text);

  data.time = parseTime(text);

  const priorityMatch = text.match(/\b(high|medium|low)(?:\s+priority)?\b/i);
  if (priorityMatch) {
    data.priority = priorityMatch[1].toLowerCase() as 'high' | 'medium' | 'low';
  }

  const categoryPattern = /\bcategory:\s*(Work|Personal|Health|Finance|Other)\b/i;
  const categoryMatch = text.match(categoryPattern) ||
                       text.match(/\b(Work|Personal|Health|Finance|Other)\s+(?:category|type)\b/i) ||
                       text.match(/\b(Work|Personal|Health|Finance|Other)\b/i);
  
  if (categoryMatch) {
    data.category = categoryMatch[1];
  }

  return data;
}