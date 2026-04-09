import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import {
  FiFileText,
  FiAlertTriangle,
  FiPackage,
  FiBarChart2,
  FiActivity,
  FiDownload,
  FiFilter,
  FiX,
} from "react-icons/fi";

const Reports = () => {
  const [activeReport, setActiveReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    department_id: "",
    category_id: "",
    status: "",
    start_date: "",
    end_date: "",
  });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchDepartments();
    fetchCategories();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      // Handle both array and object responses
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
      setDepartments([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      // Handle both array and object responses
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
      setCategories([]);
    }
  };

  const generateReport = async (reportType) => {
    setLoading(true);
    setActiveReport(reportType);
    try {
      let endpoint = `/reports/${reportType}`;
      const params = new URLSearchParams();

      if (filters.department_id)
        params.append("department_id", filters.department_id);
      if (filters.category_id)
        params.append("category_id", filters.category_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

      const queryString = params.toString();
      if (queryString) endpoint += `?${queryString}`;

      const response = await api.get(endpoint);
      setReportData(response.data.data);
      toast.success("Report generated successfully!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const closeReport = () => {
    setActiveReport(null);
    setReportData(null);
    setFilters({
      department_id: "",
      category_id: "",
      status: "",
      start_date: "",
      end_date: "",
    });
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "";
    let filename = `${activeReport}-report.csv`;

    switch (activeReport) {
      case "inventory":
        csvContent =
          "Item Code,Item Name,Category,Department,Total Qty,Available Qty,Issued Qty,Unit Price,Total Value,Status\n";
        reportData.items.forEach((item) => {
          csvContent += `"${item.item_code}","${item.name}","${
            item.category_name || ""
          }","${item.department_name || ""}",${item.quantity_total},${
            item.quantity_available
          },${item.quantity_issued},${item.unit_price},${item.total_value},"${
            item.status
          }"\n`;
        });
        break;

      case "low-stock":
        csvContent =
          "Item Code,Item Name,Available Qty,Min Threshold,Shortage,Supplier,Supplier Contact\n";
        reportData.items.forEach((item) => {
          csvContent += `"${item.item_code}","${item.name}",${
            item.quantity_available
          },${item.min_threshold},${item.shortage},"${
            item.supplier_name || ""
          }","${item.supplier_phone || ""}"\n`;
        });
        break;

      case "issued":
        csvContent =
          "Issue No,Item Name,Quantity,Recipient,Status,Issue Date,Expected Return,Days Overdue\n";
        reportData.items.forEach((item) => {
          csvContent += `"${item.issue_no}","${item.item_name}",${
            item.quantity
          },"${item.recipient_name}","${item.status}","${new Date(
            item.issue_date
          ).toLocaleDateString()}","${new Date(
            item.expected_return_date
          ).toLocaleDateString()}",${item.days_overdue}\n`;
        });
        break;

      case "department":
        csvContent =
          "Department,Code,Total Items,Total Quantity,Available Qty,Issued Qty,Total Value,Low Stock Items,Active Issues\n";
        reportData.departments.forEach((dept) => {
          csvContent += `"${dept.name}","${dept.code}",${dept.total_items},${dept.total_quantity},${dept.available_quantity},${dept.issued_quantity},${dept.total_value},${dept.low_stock_count},${dept.active_issues}\n`;
        });
        break;

      case "audit":
        csvContent = "Date,Action,Entity Type,Performed By,IP Address\n";
        reportData.logs.forEach((log) => {
          csvContent += `"${new Date(log.created_at).toLocaleString()}","${
            log.action
          }","${log.entity_type}","${log.performed_by_name || "N/A"}","${
            log.ip_address || "N/A"
          }"\n`;
        });
        break;

      default:
        return;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast.success("Report exported successfully!");
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value || 0);
  };

  const reportCards = [
    {
      id: "inventory",
      title: "Inventory Report",
      description: "Complete inventory with quantities and values",
      icon: FiFileText,
      color: "bg-blue-500",
    },
    {
      id: "low-stock",
      title: "Low Stock Report",
      description: "Items below minimum threshold",
      icon: FiAlertTriangle,
      color: "bg-red-500",
    },
    {
      id: "issued",
      title: "Issued Items Report",
      description: "All issued items by date range",
      icon: FiPackage,
      color: "bg-yellow-500",
    },
    {
      id: "department",
      title: "Department Report",
      description: "Department-wise inventory breakdown",
      icon: FiBarChart2,
      color: "bg-green-500",
    },
    {
      id: "audit",
      title: "Audit Report",
      description: "Complete audit trail of all actions",
      icon: FiActivity,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reports</h1>
        {activeReport && (
          <button
            onClick={closeReport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <FiX /> Close Report
          </button>
        )}
      </div>

      {!activeReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((report) => (
            <div
              key={report.id}
              onClick={() => generateReport(report.id)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4 hover:border-l-8"
              style={{ borderColor: report.color.replace("bg-", "") }}
            >
              <div className="flex items-start gap-4">
                <div className={`${report.color} p-3 rounded-lg text-white`}>
                  <report.icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter />
              <h3 className="font-semibold">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(activeReport === "inventory" ||
                activeReport === "issued" ||
                activeReport === "low-stock") && (
                <select
                  value={filters.department_id}
                  onChange={(e) =>
                    setFilters({ ...filters, department_id: e.target.value })
                  }
                  className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              )}

              {activeReport === "inventory" && (
                <>
                  <select
                    value={filters.category_id}
                    onChange={(e) =>
                      setFilters({ ...filters, category_id: e.target.value })
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="issued">Issued</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </>
              )}

              {activeReport === "issued" && (
                <>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End Date"
                  />
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="issued">Issued</option>
                    <option value="partial_return">Partial Return</option>
                    <option value="returned">Returned</option>
                  </select>
                </>
              )}

              {activeReport === "audit" && (
                <>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End Date"
                  />
                </>
              )}

              <button
                onClick={() => generateReport(activeReport)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generating report...</p>
            </div>
          )}

          {/* Report Content */}
          {!loading && reportData && (
            <>
              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <FiDownload /> Export to CSV
                </button>
              </div>

              {/* Inventory Report */}
              {activeReport === "inventory" && (
                <div className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reportData.summary.total_items}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(reportData.summary.total_value)}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                      <p className="text-sm text-gray-600">Available Qty</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {reportData.summary.available_quantity}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                      <p className="text-sm text-gray-600">Issued Qty</p>
                      <p className="text-2xl font-bold text-red-600">
                        {reportData.summary.issued_quantity}
                      </p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Item Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total Qty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Available
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Issued
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Unit Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {item.item_code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.category_name || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.department_name || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.quantity_total}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.quantity_available}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.quantity_issued}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                {formatCurrency(item.total_value)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    item.status === "available"
                                      ? "bg-green-100 text-green-800"
                                      : item.status === "issued"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Low Stock Report */}
              {activeReport === "low-stock" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                      <p className="text-sm text-gray-600">
                        Critical Items (Out of Stock)
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {reportData.summary.critical_items}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                      <p className="text-sm text-gray-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {reportData.summary.low_stock_items}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                      <p className="text-sm text-gray-600">Total Shortage</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {reportData.summary.total_shortage}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600">Est. Reorder Cost</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          reportData.summary.estimated_reorder_cost
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Item Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Available
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Min Threshold
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Shortage
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Supplier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Contact
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.items.map((item) => (
                            <tr
                              key={item.id}
                              className={
                                item.quantity_available === 0
                                  ? "bg-red-50"
                                  : "hover:bg-gray-50"
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {item.item_code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span
                                  className={
                                    item.quantity_available === 0
                                      ? "text-red-600 font-bold"
                                      : ""
                                  }
                                >
                                  {item.quantity_available}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.min_threshold}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                                {item.shortage}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.supplier_name || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.supplier_phone || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Issued Items Report */}
              {activeReport === "issued" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600">Total Issues</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reportData.summary.total_issues}
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                      <p className="text-sm text-gray-600">Active Issues</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {reportData.summary.active_issues}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                      <p className="text-sm text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-red-600">
                        {reportData.summary.overdue_issues}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                      <p className="text-sm text-gray-600">Partial Returns</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {reportData.summary.partial_returns}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reportData.summary.completed_returns}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Issue No
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Item
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Recipient
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Issue Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Expected Return
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.items.map((item) => (
                            <tr
                              key={item.id}
                              className={
                                item.is_overdue
                                  ? "bg-red-50"
                                  : "hover:bg-gray-50"
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {item.issue_no}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.item_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.recipient_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(item.issue_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Date(
                                  item.expected_return_date
                                ).toLocaleDateString()}
                                {item.is_overdue && (
                                  <span className="ml-2 text-red-600 font-semibold">
                                    ({item.days_overdue}d overdue)
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    item.status === "issued"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : item.status === "partial_return"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                {formatCurrency(item.issued_value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Department Report */}
              {activeReport === "department" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600">Total Departments</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reportData.totals.total_departments}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reportData.totals.total_items}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(reportData.totals.total_value)}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                      <p className="text-sm text-gray-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-red-600">
                        {reportData.totals.total_low_stock}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Department
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total Items
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Available Qty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Issued Qty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total Value
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Low Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Active Issues
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.departments.map((dept) => (
                            <tr key={dept.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {dept.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {dept.code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {dept.total_items}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {dept.available_quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {dept.issued_quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                {formatCurrency(dept.total_value)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {dept.low_stock_count > 0 ? (
                                  <span className="text-red-600 font-semibold">
                                    {dept.low_stock_count}
                                  </span>
                                ) : (
                                  <span className="text-green-600">0</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {dept.active_issues}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Report */}
              {activeReport === "audit" && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Entity Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Performed By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            IP Address
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  log.action === "create"
                                    ? "bg-green-100 text-green-800"
                                    : log.action === "update"
                                    ? "bg-blue-100 text-blue-800"
                                    : log.action === "delete"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {log.entity_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {log.performed_by_name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="text-xs uppercase">
                                {log.performed_by_role || "N/A"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.ip_address || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
