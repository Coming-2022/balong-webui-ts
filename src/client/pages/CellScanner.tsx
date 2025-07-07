import React from 'react';

export default function CellScanner() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          🔍 小区扫描
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          扫描周围的5G/LTE小区并显示详细信息
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-center text-gray-500 dark:text-gray-400">
            小区扫描页面正在开发中...
          </p>
        </div>
      </div>
    </div>
  );
}
