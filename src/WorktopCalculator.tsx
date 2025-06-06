// src/WorktopCalculator.tsx
import React, { useState, useMemo, ChangeEvent } from "react";
import { Save, FileDown, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { jsPDF } from "jspdf";

// Define an interface for a single worktop entry
interface Worktop {
  id: number;
  length: string;
  width: string;
  useCustomPerim: boolean;
  customPerimeter: string;
  innerLength: string;
  innerWidth: string;
  hasInnerEdging: boolean;
}

const toNumber = (value: string): number => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

const WorktopCalculator: React.FC = () => {
  const [worktops, setWorktops] = useState<Worktop[]>([
    { id: 1, length: "", width: "", useCustomPerim: false, customPerimeter: "", innerLength: "", innerWidth: "", hasInnerEdging: false },
  ]);
  const [expandedId, setExpandedId] = useState<number>(1);

  // Helper to update a field of a specific worktop
  const updateWorktop = (id: number, field: keyof Worktop, value: string | boolean) => {
    setWorktops((prev) =>
      prev.map((wt) => (wt.id === id ? { ...wt, [field]: value } : wt))
    );
  };

  // Add a new blank worktop
  const addWorktop = () => {
    const newId = Date.now();
    setWorktops((prev) => [
      ...prev,
      {
        id: newId,
        length: "",
        width: "",
        useCustomPerim: false,
        customPerimeter: "",
        innerLength: "",
        innerWidth: "",
        hasInnerEdging: false,
      },
    ]);
    setExpandedId(newId);
  };

  // Remove a worktop by id
  const removeWorktop = (id: number) => {
    setWorktops((prev) => prev.filter((wt) => wt.id !== id));
    if (expandedId === id && worktops.length > 1) {
      const remaining = worktops.filter((wt) => wt.id !== id);
      setExpandedId(remaining[0].id);
    }
  };

  // Calculations per worktop
  const calculateArea = (wt: Worktop) => (toNumber(wt.length) * toNumber(wt.width)) / 10000;

  const calculateAutoPerimeter = (wt: Worktop) => ((toNumber(wt.length) * 2 + toNumber(wt.width) * 2) / 100);

  const calculatePerimeter = (wt: Worktop) =>
    wt.useCustomPerim ? toNumber(wt.customPerimeter) : calculateAutoPerimeter(wt);

  const calculatePanelCost = (area: number) => 68 * 1.6 * area;

  const calculateEdgeFinishCost = (perimeter: number) => perimeter * 3.5; // €3.50 per meter

  // Export CSV: only ID, length, width, price
  const exportCSV = () => {
    const rows: string[][] = [["Worktop ID", "Length(cm)", "Width(cm)", "Price(€)"]];
    worktops.forEach((wt, idx) => {
      const area = calculateArea(wt);
      const perimeter = calculatePerimeter(wt);
      const panelCost = calculatePanelCost(area);
      const edgeCost = calculateEdgeFinishCost(perimeter);
      const price = panelCost + edgeCost;
      const idStr = `worktop${idx + 1}`;
      rows.push([idStr, wt.length, wt.width, price.toFixed(2)]);
    });
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "worktop_quotes.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF for all worktops
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Worktop Quotations", 10, 20);
    doc.setFontSize(12);
    let y = 30;
    worktops.forEach((wt, idx) => {
      const area = calculateArea(wt);
      const perimeter = calculatePerimeter(wt);
      const panelCost = calculatePanelCost(area);
      const edgeCost = calculateEdgeFinishCost(perimeter);
      const price = panelCost + edgeCost;
      const idStr = `worktop${idx + 1}`;
      const lines = [
        `Worktop #${idx + 1} (ID:${idStr})`,
        `  Length (cm): ${wt.length}`,
        `  Width (cm): ${wt.width}`,
        `  Price (€): ${price.toFixed(2)}`,
        `  Inner Length (cm): ${wt.innerLength}`,
        `  Inner Width (cm): ${wt.innerWidth}`,
        `  Inner Edging: ${wt.hasInnerEdging ? "Yes" : "No"}`,
      ];
      lines.forEach((line) => {
        doc.text(line, 10, y);
        y += 8;
      });
      y += 8; // space between worktops
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("worktop_quotes.pdf");
  };

  // SVG preview helper
  const renderSVGPreview = (wt: Worktop) => {
    const lengthNum = toNumber(wt.length);
    const widthNum = toNumber(wt.width);
    if (!lengthNum || !widthNum) return null;
    const maxDim = Math.max(lengthNum, widthNum);
    const scale = 200 / maxDim; // fit within 200px
    const wPx = lengthNum * scale;
    const hPx = widthNum * scale;
    const innerL = toNumber(wt.innerLength);
    const innerW = toNumber(wt.innerWidth);
    const innerOffsetX = (lengthNum - innerL) / 2 * scale;
    const innerOffsetY = (widthNum - innerW) / 2 * scale;
    const innerWPx = innerL * scale;
    const innerHPx = innerW * scale;

    return (
      <svg
        width={wPx + 4}
        height={hPx + 4}
        className="border border-gray-300 bg-white"
      >
        <rect
          x={2}
          y={2}
          width={wPx}
          height={hPx}
          fill="#f3f4f6"
          stroke="#4b5563"
          strokeWidth={1}
        />
        {innerL && innerW ? (
          <rect
            x={2 + innerOffsetX}
            y={2 + innerOffsetY}
            width={innerWPx}
            height={innerHPx}
            fill="#ffffff"
            stroke="#1f2937"
            strokeWidth={1}
          />
        ) : null}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {worktops.map((wt, index) => {
        const isExpanded = wt.id === expandedId;
        const idx = index;
        return (
          <div key={wt.id} className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Worktop #{idx + 1}</h2>
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <button onClick={() => setExpandedId(-1)} className="text-gray-600 hover:text-gray-800">
                    <ChevronUp size={20} />
                  </button>
                ) : (
                  <button onClick={() => setExpandedId(wt.id)} className="text-gray-600 hover:text-gray-800">
                    <ChevronDown size={20} />
                  </button>
                )}
                <button onClick={() => removeWorktop(wt.id)} className="text-gray-600 hover:text-red-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="flex flex-col md:flex-row p-6 space-y-6 md:space-y-0 md:space-x-6">
                {/* Left: inputs and results */}
                <div className="md:w-2/3 space-y-6">
                  <h3 className="text-lg font-medium">Panel Cut Size</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`length-${wt.id}`} className="block text-sm font-medium text-gray-700">
                        Length (cm)
                      </label>
                      <input
                        id={`length-${wt.id}`}
                        type="number"
                        min="0"
                        value={wt.length}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateWorktop(wt.id, "length", e.target.value)
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        placeholder="e.g. 200"
                      />
                    </div>
                    <div>
                      <label htmlFor={`width-${wt.id}`} className="block text-sm font-medium text-gray-700">
                        Width (cm)
                      </label>
                      <input
                        id={`width-${wt.id}`}
                        type="number"
                        min="0"
                        value={wt.width}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateWorktop(wt.id, "width", e.target.value)
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        placeholder="e.g. 60"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area (m²)</label>
                      <div className="mt-1 p-2 bg-gray-100 rounded-md text-lg">
                        {calculateArea(wt).toFixed(2)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          id={`useCustomPerim-${wt.id}`}
                          type="checkbox"
                          checked={wt.useCustomPerim}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateWorktop(wt.id, "useCustomPerim", e.target.checked)
                          }
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`useCustomPerim-${wt.id}`} className="text-sm font-medium text-gray-700">
                          Use custom perimeter
                        </label>
                      </div>
                      {wt.useCustomPerim ? (
                        <input
                          type="number"
                          min="0"
                          value={wt.customPerimeter}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateWorktop(wt.id, "customPerimeter", e.target.value)
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                          placeholder="Custom perimeter (m)"
                        />
                      ) : (
                        <div className="mt-1 p-2 bg-gray-100 rounded-md text-lg">
                          {calculateAutoPerimeter(wt).toFixed(2)} m
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg font-medium">Inner Cut / Sink / Hob</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`innerLength-${wt.id}`} className="block text-sm font-medium text-gray-700">
                        Length (cm)
                      </label>
                      <input
                        id={`innerLength-${wt.id}`}
                        type="number"
                        min="0"
                        value={wt.innerLength}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateWorktop(wt.id, "innerLength", e.target.value)
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        placeholder="e.g. 50"
                      />
                    </div>
                    <div>
                      <label htmlFor={`innerWidth-${wt.id}`} className="block text-sm font-medium text-gray-700">
                        Width (cm)
                      </label>
                      <input
                        id={`innerWidth-${wt.id}`}
                        type="number"
                        min="0"
                        value={wt.innerWidth}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          updateWorktop(wt.id, "innerWidth", e.target.value)
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                        placeholder="e.g. 40"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id={`innerEdging-${wt.id}`}
                      type="checkbox"
                      checked={wt.hasInnerEdging}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateWorktop(wt.id, "hasInnerEdging", e.target.checked)
                      }
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor={`innerEdging-${wt.id}`} className="text-sm font-medium text-gray-700">
                      Add edging/finishing to inner cut
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="rounded-lg bg-indigo-50 p-4 flex flex-col justify-center">
                      <span className="text-sm uppercase tracking-wide text-gray-600">Panel Cost</span>
                      <span className="text-2xl font-bold text-indigo-800">€ {calculatePanelCost(calculateArea(wt)).toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-4 flex flex-col justify-center">
                      <span className="text-sm uppercase tracking-wide text-gray-600">Edge Finish Cost</span>
                      <span className="text-2xl font-bold text-indigo-800">€ {calculateEdgeFinishCost(calculatePerimeter(wt)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {/* Right: SVG Preview */}
                <div className="md:w-1/3 flex justify-center items-center">
                  {renderSVGPreview(wt)}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {/* Add another worktop button */}
      <div className="flex justify-center">
        <button
          onClick={addWorktop}
          className="inline-flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          <Plus size={16} /> Add Worktop
        </button>
      </div>
      {/* Export all */}
      <div className="flex justify-center space-x-4 pt-6">
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <FileDown size={16} /> Export All CSV
        </button>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Save size={16} /> Export All PDF
        </button>
      </div>
    </div>
  );
};

export default WorktopCalculator;
