import React from "react";
import WorktopCalculator from "./WorktopCalculator";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Fixmor Custom Calculator
      </h1>
      <WorktopCalculator />
    </div>
  );
};

export default App;
