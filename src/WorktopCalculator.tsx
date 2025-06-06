// src/WorktopCalculator.tsx
import React, { useState, ChangeEvent } from "react";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { jsPDF } from "jspdf";
import logo from "./logo.png";

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
    {
      id: 1,
      length: "",
      width: "",
      useCustomPerim: false,
      customPerimeter: "",
      innerLength: "",
      innerWidth: "",
      hasInnerEdging: false,
    },
  ]);
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const updateWorktop = (
    id: number,
    field: keyof Worktop,
    value: string | boolean
  ) => {
    setWorktops((prev) =>
      prev.map((wt) => (wt.id === id ? { ...wt, [field]: value } : wt))
    );
  };

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

  const removeWorktop = (id: number) => {
    setWorktops((prev) => prev.filter((wt) => wt.id !== id));
    if (expandedId === id) {
      const remaining = worktops.filter((wt) => wt.id !== id);
      setExpandedId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const calculateArea = (wt: Worktop) =>
    (toNumber(wt.length) * toNumber(wt.width)) / 10000;
  const calculateAutoPerimeter = (wt: Worktop) =>
    (toNumber(wt.length) * 2 + toNumber(wt.width) * 2) / 100;
  const calculatePerimeter = (wt: Worktop) =>
    wt.useCustomPerim ? toNumber(wt.customPerimeter) : calculateAutoPerimeter(wt);
  const calculatePanelCost = (area: number) => 68 * 1.6 * area;
  const calculateEdgeFinishCost = (perimeter: number) => perimeter * 3.5;

  const withVAT = (amount: number) => amount * 1.19;

  const grandTotals = worktops.reduce(
    (acc, wt) => {
      const area = calculateArea(wt);
      const perimeter = calculatePerimeter(wt);
      const panelCost = calculatePanelCost(area);
      const edgeCost = calculateEdgeFinishCost(perimeter);
      const price = panelCost + edgeCost;
      return {
        excl: acc.excl + price,
        incl: acc.incl + withVAT(price),
      };
    },
    { excl: 0, incl: 0 }
  );

  const exportCSV = () => {
    const rows: string[][] = [
      ["Worktop ID", "Length(cm)", "Width(cm)", "Price excl. VAT(€)", "Price incl. VAT(€)"],
    ];
    worktops.forEach((wt, idx) => {
      const area = calculateArea(wt);
      const perimeter = calculatePerimeter(wt);
      const panelCost = calculatePanelCost(area);
      const edgeCost = calculateEdgeFinishCost(perimeter);
      const price = panelCost + edgeCost;
      const priceInclVAT = withVAT(price);
      const idStr = `worktop${idx + 1}`;
      rows.push([idStr, wt.length, wt.width, price.toFixed(2), priceInclVAT.toFixed(2)]);
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
      const priceInclVAT = withVAT(price);
      const idStr = `worktop${idx + 1}`;
      const lines = [
        `Worktop #${idx + 1} (ID:${idStr})`,
        `  Length (cm): ${wt.length}`,
        `  Width (cm): ${wt.width}`,
        `  Price excl. VAT (€): ${price.toFixed(2)}`,
        `  Price incl. VAT (€): ${priceInclVAT.toFixed(2)}`,
      ];
      lines.forEach((line) => {
        doc.text(line, 10, y);
        y += 8;
      });
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("worktop_quotes.pdf");
  };

  const isoX = (x: number, y: number, z: number = 0) => (x - y) * (Math.sqrt(3) / 2);
  const isoY = (x: number, y: number, z: number = 0) => (x + y) * 0.5 - z;

  const renderSVGPreview = (wt: Worktop) => {
    const lengthNum = toNumber(wt.length);
    const widthNum = toNumber(wt.width);
    if (!lengthNum || !widthNum) {
      return <div className="text-gray-400">No dimensions</div>;
    }
    const thickness = 2;
    const topCorners = [
      { x: 0, y: 0, z: 0 },
      { x: lengthNum, y: 0, z: 0 },
      { x: lengthNum, y: widthNum, z: 0 },
      { x: 0, y: widthNum, z: 0 },
    ];
    const bottomCorners = [
      { x: 0, y: 0, z: -thickness },
      { x: lengthNum, y: 0, z: -thickness },
      { x: lengthNum, y: widthNum, z: -thickness },
      { x: 0, y: widthNum, z: -thickness },
    ];
    const projTop = topCorners.map((p) => ({ x: isoX(p.x, p.y, p.z), y: isoY(p.x, p.y, p.z) }));
    const projBottom = bottomCorners.map((p) => ({ x: isoX(p.x, p.y, p.z), y: isoY(p.x, p.y, p.z) }));

    const innerL = toNumber(wt.innerLength);
    const innerW = toNumber(wt.innerWidth);
    const innerX0 = (lengthNum - innerL) / 2;
    const innerY0 = (widthNum - innerW) / 2;
    const innerCorners = [
      { x: innerX0, y: innerY0, z: 0 },
      { x: innerX0 + innerL, y: innerY0, z: 0 },
      { x: innerX0 + innerL, y: innerY0 + innerW, z: 0 },
      { x: innerX0, y: innerY0 + innerW, z: 0 },
    ];
    const projInner = innerCorners.map((p) => ({ x: isoX(p.x, p.y, p.z), y: isoY(p.x, p.y, p.z) }));

    const allX = [...projTop, ...projBottom, ...projInner].map((p) => p.x);
    const allY = [...projTop, ...projBottom, ...projInner].map((p) => p.y);
    const minX = Math.min(...allX);
    const minY = Math.min(...allY);
    const maxX = Math.max(...allX);
    const maxY = Math.max(...allY);
    const padding = 1;
    const vbX = minX - padding;
    const vbY = minY - padding;
    const vbW = maxX - minX + padding * 2;
    const vbH = maxY - minY + padding * 2;

    return (
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full bg-transparent"
      >
        {[0, 1, 2, 3].map((i) => {
          const j = (i + 1) % 4;
          return (
            <polygon
              key={i}
              points={
                `${projTop[i].x},${projTop[i].y} ` +
                `${projTop[j].x},${projTop[j].y} ` +
                `${projBottom[j].x},${projBottom[j].y} ` +
                `${projBottom[i].x},${projBottom[i].y}`
              }
              fill="#444444"
              stroke="#888888"
              strokeWidth={0.05}
            />
          );
        })}
        <polygon
          points={projBottom.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="#555555"
          stroke="#888888"
          strokeWidth={0.05}
        />
        <polygon
          points={projTop.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="#666666"
          stroke="#AAAAAA"
          strokeWidth={0.05}
        />
        {innerL && innerW ? (
          <polygon
            points={projInner.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="#222222"
            stroke="#AAAAAA"
            strokeWidth={0.05}
          />
        ) : null}
        <line
          x1={projTop[0].x}
          y1={projTop[0].y - 0.5}
          x2={projTop[1].x}
          y2={projTop[1].y - 0.5}
          stroke="#FFFFFF"
          strokeWidth={0.02}
        />
        <text
          x={(projTop[0].x + projTop[1].x) / 2}
          y={(projTop[0].y + projTop[1].y) / 2 - 0.8}
          fontSize={0.7}
          fill="#FFFFFF"
          textAnchor="middle"
        >
          {`${lengthNum} cm`}
        </text>
        <line
          x1={projTop[1].x + 0.5}
          y1={projTop[1].y}
          x2={projTop[2].x + 0.5}
          y2={projTop[2].y}
          stroke="#FFFFFF"
          strokeWidth={0.02}
        />
        <text
          x={(projTop[1].x + projTop[2].x) / 2 + 0.5}
          y={(projTop[1].y + projTop[2].y) / 2}
          fontSize={0.7}
          fill="#FFFFFF"
          textAnchor="middle"
          transform={`rotate(-30 ${(projTop[1].x + projTop[2].x) / 2 + 0.5} ${(projTop[1].y + projTop[2].y) / 2})`}
        >
          {`${widthNum} cm`}
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="flex justify-center mb-8">
        <img src={logo} alt="Logo" className="h-12" />
      </div>
      <h1 className="text-3xl font-bold text-center mb-8">KITCHEN WORKTOP CALCULATOR</h1>
      <div className="flex space-x-6">
        <div className="w-2/3">
          <div className="bg-gray-800 p-6 rounded-xl">
            {worktops.map((wt, index) => {
              const isExpanded = wt.id === expandedId;
              const idx = index;
              return (
                <div key={wt.id} className="bg-gray-700 rounded-lg shadow-md mb-6">
                  <div className="flex items-center justify-between p-4 border-b border-gray-600">
                    <h2 className="text-xl font-semibold">Worktop #{idx + 1}</h2>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <button onClick={() => setExpandedId(null)} className="text-gray-300 hover:text-gray-100">
                          <ChevronUp size={24} />
                        </button>
                      ) : (
                        <button onClick={() => setExpandedId(wt.id)} className="text-gray-300 hover:text-gray-100">
                          <ChevronDown size={24} />
                        </button>
                      )}
                      <button onClick={() => removeWorktop(wt.id)} className="text-gray-300 hover:text-red-500">
                        <X size={24} />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-6 space-y-6">
                      <h3 className="text-lg font-medium">Panel Cut Size</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`length-${wt.id}`} className="block text-sm font-medium text-gray-200">
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
                            className="mt-1 block w-full border border-gray-600 rounded-lg p-3 bg-gray-900 placeholder-gray-500 text-gray-100"
                            placeholder="e.g. 200"
                          />
                        </div>
                        <div>
                          <label htmlFor={`width-${wt.id}`} className="block text-sm font-medium text-gray-200">
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
                            className="mt-1 block w-full border border-gray-600 rounded-lg p-3 bg-gray-900 placeholder-gray-500 text-gray-100"
                            placeholder="e.g. 200"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center">
                        <div>
                          <label className="block text-sm font-medium text-gray-200">Area (m²)</label>
                          <input
                            type="text"
                            readOnly
                            value={calculateArea(wt).toFixed(2)}
                            className="mt-1 block w-full border border-gray-600 rounded-lg p-3 bg-gray-800 text-gray-100"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center cursor-pointer">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={wt.useCustomPerim}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  updateWorktop(wt.id, "useCustomPerim", e.target.checked)
                                }
                                className="sr-only"
                              />
                              <div
                                className={`block w-12 h-6 rounded-full ${
                                  wt.useCustomPerim ? "bg-green-500" : "bg-gray-600"
                                }`}
                              />
                              <div
                                className={`dot absolute left-1 top-1 bg-gray-200 w-4 h-4 rounded-full transition ${
                                  wt.useCustomPerim ? "translate-x-6" : ""
                                }`}
                              ></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-200">Custom Perimeter</span>
                          </label>
                          {wt.useCustomPerim ? (
                            <input
                              type="number"
                              min="0"
                              value={wt.customPerimeter}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                updateWorktop(wt.id, "customPerimeter", e.target.value)
                              }
                              className="mt-1 block w-32 border border-gray-600 rounded-lg p-3 bg-gray-900 placeholder-gray-500 text-gray-100"
                              placeholder="m"
                            />
                          ) : (
                            <input
                              type="text"
                              readOnly
                              value={`${calculateAutoPerimeter(wt).toFixed(2)} m`}
                              className="mt-1 block w-32 border border-gray-600 rounded-lg p-3 bg-gray-800 text-gray-100"
                            />
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-medium">Sink/Hob Cut</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={`innerLength-${wt.id}`} className="block text-sm font-medium text-gray-200">
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
                            className="mt-1 block w-full border border-gray-600 rounded-lg p-3 bg-gray-900 placeholder-gray-500 text-gray-100"
                            placeholder="e.g. 50"
                          />
                        </div>
                        <div>
                          <label htmlFor={`innerWidth-${wt.id}`} className="block text-sm font-medium text-gray-200">
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
                            className="mt-1 block w-full border border-gray-600 rounded-lg p-3 bg-gray-900 placeholder-gray-500 text-gray-100"
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
                          className="h-4 w-4 text-green-500 border-gray-400 rounded"
                        />
                        <label htmlFor={`innerEdging-${wt.id}`} className="text-sm font-medium text-gray-200">
                          Add edging/finishing to inner cut
                        </label>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="bg-gray-700 p-3 rounded-lg text-center">
                          <div className="text-xs font-semibold text-gray-400">PANEL COST</div>
                          <div className="text-2xl font-bold text-gray-100">
                            € {calculatePanelCost(calculateArea(wt)).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">excl. VAT</div>
                          <div className="text-2xl font-bold text-gray-100 mt-1">
                            € {withVAT(calculatePanelCost(calculateArea(wt))).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">incl. VAT</div>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg text-center">
                          <div className="text-xs font-semibold text-gray-400">EDGE FINISH COST</div>
                          <div className="text-2xl font-bold text-gray-100">
                            € {calculateEdgeFinishCost(calculatePerimeter(wt)).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">excl. VAT</div>
                          <div className="text-2xl font-bold text-gray-100 mt-1">
                            € {withVAT(calculateEdgeFinishCost(calculatePerimeter(wt))).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">incl. VAT</div>
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg text-center">
                          <div className="text-xs font-semibold text-gray-400">TOTAL</div>
                          <div className="text-2xl font-bold text-gray-100">
                            €{" "}
                            {(
                              calculatePanelCost(calculateArea(wt)) +
                              calculateEdgeFinishCost(calculatePerimeter(wt))
                            ).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">excl. VAT</div>
                          <div className="text-2xl font-bold text-gray-100 mt-1">
                            €{" "}
                            {withVAT(
                              calculatePanelCost(calculateArea(wt)) +
                                calculateEdgeFinishCost(calculatePerimeter(wt))
                            ).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">incl. VAT</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="bg-gray-700 rounded-lg p-4 shadow-md mb-6">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">Grand Total</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-gray-400">Excl. VAT:</div>
                <div className="text-gray-100 font-bold">€ {grandTotals.excl.toFixed(2)}</div>
                <div className="text-gray-400">Incl. VAT (19%):</div>
                <div className="text-gray-100 font-bold">€ {grandTotals.incl.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-end p-4">
              <button
                onClick={addWorktop}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-500"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex justify-center space-x-6 pb-6">
              <button
                onClick={exportCSV}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                Export CSV
              </button>
              <button
                onClick={exportPDF}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/3">
          <div className="h-full bg-gray-800 p-4 rounded-xl shadow-inner flex items-center justify-center">
            {expandedId ? (
              renderSVGPreview(worktops.find((wt) => wt.id === expandedId)!)
            ) : (
              <div className="text-gray-400">Select a worktop</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorktopCalculator;
