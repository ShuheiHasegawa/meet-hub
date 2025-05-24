"use client";

import React from "react";

interface DebugLocation {
  share_code: string;
  title?: string;
  created_at: string;
  is_active: boolean;
}

interface DebugLocationsListProps {
  locations: DebugLocation[];
}

export default function DebugLocationsList({
  locations,
}: DebugLocationsListProps) {
  const handleCopyCode = (shareCode: string) => {
    navigator.clipboard.writeText(shareCode);
    alert(`共有コード "${shareCode}" をコピーしました`);
  };

  return (
    <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-sm font-semibold mb-2">
        デバッグ: 最近の共有コード（コピーして使用可能）
      </h3>
      <div className="text-xs space-y-1">
        {locations.map((loc, index) => (
          <div key={index} className="flex justify-between">
            <button
              className="font-mono text-left hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 rounded"
              onClick={() => handleCopyCode(loc.share_code)}
            >
              {loc.share_code}
            </button>
            <span className={loc.is_active ? "text-green-600" : "text-red-600"}>
              {loc.is_active ? "有効" : "無効"}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        ↑ 共有コードをクリックするとコピーされます
      </p>
    </div>
  );
}
