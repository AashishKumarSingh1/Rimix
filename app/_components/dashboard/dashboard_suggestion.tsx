// TODO => use dynamic Scores and Suggestions

// interface DashBoardSuggestionProps {
//   sleepScore: number;
//   personalizedSuggestions: string[];
// }

const DashBoardSuggestion = () => {
  return (
    <main className="mt-12">
      <div className="w-full max-w-sm">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-1">
          Sleep Quality score
        </h2>
        <p className="text-gray-500 text-sm mb-4">Score (0–10)</p>
        <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
          6.12
        </p>
      </div>
      <div className="mt-12">
        <h2 className="text-xl sm:text-2xl md:text-3xl  font-semibold text-gray-800 mb-4">
          Personalized suggestions
        </h2>
        <ul className="list-disc pl-6 space-y-3 text-gray-700 leading-relaxed">
          <li>
            Your average sleep duration is within the typical healthy range —
            keep a consistent routine to maintain it.
          </li>
          <li>
            Good consistency in sleep duration and wake time — consistency
            supports sleep quality.
          </li>
          <li>
            Few short nights this week; keep addressing occasional short nights
            by preserving a wind-down routine.
          </li>
          <li>
            General tips: get morning daylight exposure, exercise during the day
            (not right before bed), and limit blue-light exposure at night. If
            sleep problems continue, consider tracking additional details
            (awakenings, naps, caffeine) or consult a clinician.
          </li>
        </ul>
      </div>
    </main>
  );
};

export default DashBoardSuggestion;
