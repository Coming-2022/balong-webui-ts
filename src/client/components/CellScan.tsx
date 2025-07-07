import React from 'react';

interface CellScanProps {
  user: any;
}

export default function CellScan({ user }: CellScanProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">小区扫描</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">小区扫描功能正在开发中...</p>
      </div>
    </div>
  );
}
