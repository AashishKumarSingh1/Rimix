import { Clock } from "lucide-react";

const DashboardHeader = () => {
  return (
    <header
      className={`p-6 transition-colors duration-300 
          bg-gradient-to-r from-amber-400 to-orange-500 rounded-b-2xl shadow-lg w-full`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`p-3 rounded-xl 
              bg-white bg-opacity-20`}
          >
            <Clock size={32} className="text-gray-700" />
          </div>
          <h1 className="text-3xl font-bold text-white">Rimix</h1>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
