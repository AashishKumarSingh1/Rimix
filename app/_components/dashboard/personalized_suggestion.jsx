"use client";

import { useState, useEffect } from 'react';

const PersonalizedSuggestion = ({ sleepData, reminders }) => {
  const [loading, setLoading] = useState(true);

  const sleepScoreAndSuggestions = (() => {
    if (!sleepData) {
      return {
        sleepScore: 6.12,
        suggestions: [],
      };
    }

    const { predictedSleepDuration, predictedWakeupConsistency, analysis } = sleepData;

    let durationScore = 0;
    if (predictedSleepDuration >= 7 && predictedSleepDuration <= 9) {
      durationScore = 8;
    } else if (predictedSleepDuration >= 6 && predictedSleepDuration < 7) {
      durationScore = 6;
    } else if (predictedSleepDuration > 9) {
      durationScore = 7;
    } else if (predictedSleepDuration >= 5 && predictedSleepDuration < 6) {
      durationScore = 4;
    } else {
      durationScore = 2;
    }

    const consistencyScore = Math.max(0, 10 - (predictedWakeupConsistency * 3));

    let behaviorScore = 5;

    if (analysis) {
      if (analysis.eveningReminders > 3) behaviorScore -= 2;
      else if (analysis.eveningReminders > 0) behaviorScore -= 1;

      if (analysis.highPriorityCount > 2) behaviorScore -= 2;
      else if (analysis.highPriorityCount > 0) behaviorScore -= 1;

      if (analysis.latestReminderHour >= 22) behaviorScore -= 1.5;

      if (analysis.hasStressMentions) behaviorScore -= 1;

      if (analysis.hasSleepMentions) behaviorScore += 0.5;
    }

    const finalScore = (
      durationScore * 0.4 +
      consistencyScore * 0.3 +
      behaviorScore * 0.3
    );

    const sleepScore = Math.min(10, Math.max(0, Math.round(finalScore * 100) / 100));

    const newSuggestions = [];

    if (predictedSleepDuration < 6) {
      newSuggestions.push({
        text: "Your predicted sleep duration is below recommended levels. Consider adjusting your schedule to prioritize 7-9 hours of sleep.",
        priority: "high",
        icon: "⚠️"
      });
    } else if (predictedSleepDuration >= 6 && predictedSleepDuration < 7) {
      newSuggestions.push({
        text: "Your sleep duration is slightly below optimal. Try to gradually increase it by 15-30 minutes each night.",
        priority: "medium",
        icon: "📊"
      });
    } else if (predictedSleepDuration >= 7 && predictedSleepDuration <= 9) {
      newSuggestions.push({
        text: "Great! Your predicted sleep duration is within the healthy range. Maintain this consistency for optimal rest.",
        priority: "low",
        icon: "✅"
      });
    } else {
      newSuggestions.push({
        text: "You might be sleeping too much. While rest is important, excessive sleep can sometimes indicate other health issues.",
        priority: "medium",
        icon: "🛌"
      });
    }

    if (predictedWakeupConsistency > 2.0) {
      newSuggestions.push({
        text: "Your wake-up times show significant variation. Try setting a consistent alarm time, even on weekends.",
        priority: "high",
        icon: "⏰"
      });
    } else if (predictedWakeupConsistency > 1.2) {
      newSuggestions.push({
        text: "Good consistency in your sleep schedule. Small improvements in wake-up time regularity could enhance sleep quality.",
        priority: "medium",
        icon: "👍"
      });
    } else {
      newSuggestions.push({
        text: "Excellent sleep consistency! Maintaining regular sleep and wake times supports circadian rhythm and overall sleep quality.",
        priority: "low",
        icon: "🌟"
      });
    }

    if (analysis) {
      if (analysis.eveningReminders > 3) {
        newSuggestions.push({
          text: `You have ${analysis.eveningReminders} reminders scheduled in the evening. Consider moving non-urgent tasks to earlier times to reduce pre-sleep mental load.`,
          priority: "high",
          icon: "🌙"
        });
      } else if (analysis.eveningReminders > 0) {
        newSuggestions.push({
          text: "Evening reminders can disrupt wind-down time. Try completing tasks before 8 PM to create a relaxing pre-sleep routine.",
          priority: "medium",
          icon: "📝"
        });
      }

      if (analysis.highPriorityCount > 2) {
        newSuggestions.push({
          text: `You have ${analysis.highPriorityCount} high-priority reminders. High-stress tasks can affect sleep quality. Consider breaking them into smaller, manageable steps.`,
          priority: "high",
          icon: "🎯"
        });
      } else if (analysis.highPriorityCount > 0) {
        newSuggestions.push({
          text: "High-priority tasks identified. Try scheduling demanding tasks earlier in the day to reduce evening stress.",
          priority: "medium",
          icon: "⚡"
        });
      }

      if (analysis.latestReminderHour >= 22) {
        newSuggestions.push({
          text: "Late-night reminders detected. The hour before bed should be screen-free and relaxing for better sleep quality.",
          priority: "high",
          icon: "📱"
        });
      }

      if (analysis.hasStressMentions) {
        newSuggestions.push({
          text: "Stress-related content found in your reminders. Consider incorporating relaxation techniques like meditation or deep breathing before bed.",
          priority: "medium",
          icon: "🧘"
        });
      }

      if (analysis.hasSleepMentions) {
        newSuggestions.push({
          text: "It's great that you're tracking sleep-related goals! Consider maintaining a sleep journal to identify patterns.",
          priority: "low",
          icon: "📓"
        });
      }

      if (analysis.workRelatedCount > analysis.totalReminders * 0.6) {
        newSuggestions.push({
          text: "Your reminders are heavily work-focused. Ensure you're scheduling personal time and relaxation to maintain work-life balance.",
          priority: "medium",
          icon: "⚖️"
        });
      }
    }

    newSuggestions.push({
      text: "Get morning daylight exposure to regulate your circadian rhythm and improve sleep-wake cycles.",
      priority: "low",
      icon: "☀️"
    });

    newSuggestions.push({
      text: "Regular exercise during the day (but not right before bed) can significantly improve sleep quality.",
      priority: "low",
      icon: "🏃"
    });

    newSuggestions.push({
      text: "Limit blue-light exposure from screens at least 1 hour before bedtime, or use blue-light filters.",
      priority: "medium",
      icon: "💻"
    });

    newSuggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return {
      sleepScore,
      suggestions: newSuggestions,
    };
  })();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, [sleepData, reminders]);

  const { sleepScore, suggestions } = sleepScoreAndSuggestions;

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-amber-600";
    if (score >= 4) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreDescription = (score) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Fair";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <main className="mt-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-12 bg-gray-200 rounded w-1/4 mb-12"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mt-12">
      <div className="w-full max-w-sm">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-1">
          Sleep Quality Score
        </h2>
        <p className="text-gray-500 text-sm mb-2">
          {getScoreDescription(sleepScore)} • Based on your reminder patterns
        </p>
        {sleepData?.analysis && (
          <p className="text-gray-500 text-sm mb-4">
            Analyzed {sleepData.analysis.totalReminders} reminders
            {sleepData.confidence && ` • ${Math.round(sleepData.confidence * 100)}% confidence`}
          </p>
        )}
        <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${getScoreColor(sleepScore)}`}>
          {sleepScore.toFixed(1)}
        </p>
  
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              sleepScore >= 8 ? 'bg-green-500' :
              sleepScore >= 6 ? 'bg-amber-500' :
              sleepScore >= 4 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${sleepScore * 10}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
          Personalized Suggestions
        </h2>
        
        {suggestions.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <p>Add some reminders to get personalized sleep suggestions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.slice(0, 6).map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  suggestion.priority === 'high' 
                    ? 'bg-red-50 border-red-400' 
                    : suggestion.priority === 'medium'
                    ? 'bg-amber-50 border-amber-400'
                    : 'bg-green-50 border-green-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{suggestion.icon}</span>
                  <p className="text-gray-700 leading-relaxed flex-1">
                    {suggestion.text}
                  </p>
                </div>
                {suggestion.priority === 'high' && (
                  <div className="mt-2 text-sm text-red-600 font-medium">
                    🔴 High Priority
                  </div>
                )}
                {suggestion.priority === 'medium' && (
                  <div className="mt-2 text-sm text-amber-600 font-medium">
                    🟡 Medium Priority
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            💡 Quick Sleep Tips
          </h3>
          <ul className="text-blue-700 space-y-2 text-sm">
            <li>• Maintain consistent sleep and wake times, even on weekends</li>
            <li>• Create a relaxing bedtime routine (reading, meditation)</li>
            <li>• Keep your bedroom cool, dark, and quiet</li>
            <li>• Avoid caffeine and heavy meals close to bedtime</li>
            <li>• Limit naps to 20-30 minutes earlier in the day</li>
          </ul>
        </div>
      {/* 
        {sleepData && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                console.log('User engaged with sleep suggestions');
              }}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              📈 Track your sleep progress
            </button>
          </div>
        )} */}
      </div>
    </main>
  );
};

export default PersonalizedSuggestion;