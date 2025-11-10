import DashboardGraph from "../_components/dashboard/dashboard-graph";
import DashboardHeader from "../_components/dashboard/dashboard-header";
import DashBoardSuggestion from "../_components/dashboard/dashboard_suggestion";

const DashBoard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from bg-amber-50 to-orange-50 flex flex-col items-center pb-15">
      <DashboardHeader />
      <main className="w-[90%] sm:w-[80%] md:w-[75%] text-gray-800  mt-10 flex flex-col">
        <DashboardGraph />
        <DashBoardSuggestion />
      </main>
    </div>
  );
};

export default DashBoard;
