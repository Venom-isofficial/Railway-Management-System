import React from "react";
import {
  FiPackage,
  FiTrendingUp,
  FiAlertTriangle,
  FiBox,
} from "react-icons/fi";

const Dashboard = () => {
  // This will be replaced with actual API calls
  const stats = {
    totalItems: 0,
    totalQuantity: 0,
    issuedQuantity: 0,
    lowStockItems: 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalItems}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <FiPackage className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Quantity
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalQuantity}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiBox className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Issued Items</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.issuedQuantity}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Low Stock Alerts
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.lowStockItems}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Items</h3>
          <p className="text-gray-500">No items yet</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Issues</h3>
          <p className="text-gray-500">No issues yet</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Low Stock Alerts</h3>
        <p className="text-gray-500">No low stock alerts</p>
      </div>
    </div>
  );
};

export default Dashboard;
