// src/WorktopCalculator.tsx
import React, { useState, useMemo, ChangeEvent } from "react";
import { Save, FileDown } from "lucide-react";
import { jsPDF } from "jspdf";

const toNumber = (value: string): number => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

const WorktopCalculator: React.FC = () => {
  // Panel dimensions
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");

  // Custom vs auto perimeter
  const [useCustomPerim, setUseCustomPerim] = useState<boolean>(false);
  const [customPerimeter, setCustomPerimeter] = useState<string>("");

  // Inner cut dimensions
  const [innerLength, setInnerLength] = useState<string>("");
  const [innerWidth, setInnerWidth] = useState<string>("");
  const [hasInnerEdging, setHasInnerEdging] = useState<boolean>(false);

  // === Calculations ===
  const area = useMemo<number>(() => {
    return (toNumber(length) * toNumber(width)) / 10000;
  }, [length, width]);

  const autoPerimeter = useMemo<number>(() => {
    return ((toNumber(length) * 2 + toNumber(width) * 2) / 100);
  }, [length, width]);

  const perimeter = useMemo<number>(() => {
    return useCustomPerim ? toNumber(customPerimeter) : autoPerimeter;
  }, [useCustomPerim, customPerimeter, autoPerimeter]);

  const panelCost = useMemo<number>(() => {
    // Formula: (68 * 1.6) * area
    return 68 * 1.6 * area;
  }, [area]);

  const edgeFinishCost = useMemo<number>(() => {
  // New rate: €3.50 per meter of perimeter
  return perimeter * 3.5;
}, [perimeter]);

  // === Export functions ===
  const exportCSV = () => {
    const rows = [
      ["Field", "Value"],
      ["Panel Length (cm)", length],
      ["Panel Width (cm)", width],
      ["Panel Area (m²)", area.toFixed(2)],
      ["Panel Perimeter (m)", perimeter.toFixed(2)],
      ["Panel Cost (€)", panelCost.toFixed(2)],
      ["Edge Finish Cost (€)", edgeFinishCost.toFixed(2)],
      ["Inner Cut Length (cm)", innerLength],
      ["Inner Cut Width (cm)", innerWidth],
      ["Inner Cut Edging", hasInnerEdging ? "Yes" : "No"],
    ];
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "worktop_quote.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Worktop Quotation", 10, 20);
    doc.setFontSize(12);

    const lines = [
      `Panel Length (cm): ${length}`,
      `Panel Width (cm): ${width}`,
      `Panel Area (m²): ${area.toFixed(2)}`,
      `Panel Perimeter (m): ${perimeter.toFixed(2)}`,
      `Panel Cost (€): ${panelCost.toFixed(2)}`,
      `Edge Finish Cost (€): ${edgeFinishCost.toFixed(2)}`,
      `Inner Cut Length (cm): ${innerLength}`,
      `Inner Cut Width (cm): ${innerWidth}`,
      `Inner Cut Edging: ${hasInnerEdging ? "Yes" : "No"}`,
    ];
    lines.forEach((line, idx) => {
      doc.text(line, 10, 30 + idx * 8);
    });
    doc.save("worktop_quote.pdf");
  };

  // === Render ===
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Panel Cut Size */}
      <h2 className="text-xl font-semibold">Panel Cut Size</h2>
      <div className="grid grid-cols-2 gap-4">
        {/* Length */}
        <div>
          <label htmlFor="length" className="block text-sm font-medium text-gray-700">
            Length (cm)
          </label>
          <input
            id="length"
            type="number"
            min="0"
            value={length}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLength(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g. 200"
          />
        </div>
        {/* Width */}
        <div>
          <label htmlFor="width" className="block text-sm font-medium text-gray-700">
            Width (cm)
          </label>
          <input
            id="width"
            type="number"
            min="0"
            value={width}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setWidth(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g. 60"
          />
        </div>
      </div>

      {/* Area & Perimeter */}
      <div className="grid grid-cols-2 gap-4 items-end">
        {/* Area (output) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Area (m²)</label>
          <div className="mt-1 p-2 bg-gray-100 rounded-md text-lg">
            {area.toFixed(2)}
          </div>
        </div>

        {/* Perimeter (auto or custom) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id="useCustomPerim"
              type="checkbox"
              checked={useCustomPerim}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUseCustomPerim(e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="useCustomPerim" className="text-sm font-medium text-gray-700">
              Use custom perimeter
            </label>
          </div>
          {useCustomPerim ? (
            <input
              id="customPerimeter"
              type="number"
              min="0"
              value={customPerimeter}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomPerimeter(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Custom perimeter (m)"
            />
          ) : (
            <div className="mt-1 p-2 bg-gray-100 rounded-md text-lg">
              {autoPerimeter.toFixed(2)} m
            </div>
          )}
        </div>
      </div>

      {/* Inner Cut / Sink / Hob */}
      <h2 className="text-xl font-semibold">Inner Cut / Sink / Hob</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="innerLength" className="block text-sm font-medium text-gray-700">
            Length (cm)
          </label>
          <input
            id="innerLength"
            type="number"
            min="0"
            value={innerLength}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInnerLength(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g. 50"
          />
        </div>
        <div>
          <label htmlFor="innerWidth" className="block text-sm font-medium text-gray-700">
            Width (cm)
          </label>
          <input
            id="innerWidth"
            type="number"
            min="0"
            value={innerWidth}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInnerWidth(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="e.g. 40"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="innerEdging"
          type="checkbox"
          checked={hasInnerEdging}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setHasInnerEdging(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
        <label htmlFor="innerEdging" className="text-sm font-medium text-gray-700">
          Add edging/finishing to inner cut
        </label>
      </div>

      {/* Result Boxes */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="rounded-lg bg-indigo-50 p-4 flex flex-col justify-center">
          <span className="text-sm uppercase tracking-wide text-gray-600">Panel Cost</span>
          <span className="text-2xl font-bold text-indigo-800">
            € {panelCost.toFixed(2)}
          </span>
        </div>
        <div className="rounded-lg bg-indigo-50 p-4 flex flex-col justify-center">
          <span className="text-sm uppercase tracking-wide text-gray-600">Edge Finish Cost</span>
          <span className="text-2xl font-bold text-indigo-800">
            € {edgeFinishCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <FileDown size={16} />
          Export CSV
        </button>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Save size={16} />
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default WorktopCalculator;
