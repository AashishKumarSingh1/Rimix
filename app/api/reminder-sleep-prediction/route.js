import { NextResponse } from 'next/server';

function analyzeReminderPatterns(reminders) {
  if (!reminders || reminders.length === 0) {
    return getDefaultPrediction();
  }

  let totalReminders = reminders.length;
  let eveningReminders = 0;
  let highPriorityCount = 0;
  let workRelatedCount = 0;
  let hasSleepMentions = false;
  let hasStressMentions = false;
  let latestReminderHour = 0;

  const sleepKeywords = ['sleep', 'bed', 'wake up', 'alarm', 'rest', 'tired', 'nap', 'dream'];
  const stressKeywords = ['urgent', 'important', 'deadline', 'meeting', 'due', 'asap', 'emergency', 'critical'];

  reminders.forEach(reminder => {
    if (reminder.time) {
      const hour = parseInt(reminder.time.split(':')[0]);
      if (hour >= 18) eveningReminders++;
      latestReminderHour = Math.max(latestReminderHour, hour);
    }

    if (reminder.priority === 'high') highPriorityCount++;

    if (reminder.category === 'Work' || reminder.category === 'Finance') workRelatedCount++;

    const title = reminder.title.toLowerCase();
    const description = (reminder.description || '').toLowerCase();
    const fullText = title + ' ' + description;

    if (sleepKeywords.some(keyword => fullText.includes(keyword))) {
      hasSleepMentions = true;
    }

    if (stressKeywords.some(keyword => fullText.includes(keyword))) {
      hasStressMentions = true;
    }
  });

  const eveningRatio = eveningReminders / totalReminders;
  const highPriorityRatio = highPriorityCount / totalReminders;
  const workRatio = workRelatedCount / totalReminders;

  let predictedSleep = 7.5;

  predictedSleep -= eveningRatio * 1.5;
  predictedSleep -= highPriorityRatio * 1.0;
  predictedSleep -= workRatio * 0.5;
  predictedSleep -= hasStressMentions ? 0.5 : 0;
  predictedSleep += hasSleepMentions ? 0.3 : 0;

  if (latestReminderHour >= 22) {
    predictedSleep -= 0.8;
  }

  let wakeupConsistency = 1.0;
  wakeupConsistency += highPriorityRatio * 0.8;
  wakeupConsistency += workRatio * 0.3;
  wakeupConsistency += (totalReminders / 15);
  wakeupConsistency += hasStressMentions ? 0.4 : 0;

  predictedSleep = Math.max(4, Math.min(10, predictedSleep));
  wakeupConsistency = Math.max(0.5, Math.min(3.0, wakeupConsistency));

  return {
    predictedSleepDuration: Math.round(predictedSleep * 10) / 10,
    predictedWakeupConsistency: Math.round(wakeupConsistency * 10) / 10,
    analysis: {
      totalReminders,
      eveningReminders,
      highPriorityCount,
      workRelatedCount,
      hasSleepMentions,
      hasStressMentions,
      latestReminderHour
    },
    confidence: 0.78
  };
}

function getDefaultPrediction() {
  return {
    predictedSleepDuration: 7.5,
    predictedWakeupConsistency: 1.2,
    analysis: {
      totalReminders: 0,
      eveningReminders: 0,
      highPriorityCount: 0,
      workRelatedCount: 0,
      hasSleepMentions: false,
      hasStressMentions: false,
      latestReminderHour: 0
    },
    confidence: 0.5
  };
}

export async function POST(request) {
  try {
    const { reminders } = await request.json();
    
    const prediction = analyzeReminderPatterns(reminders);
    
    return NextResponse.json({
      ok: true,
      data: prediction
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to analyze sleep patterns' },
      { status: 500 }
    );
  }
}