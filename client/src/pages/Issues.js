import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../utils/api";
import {
  FiPlus,
  FiX,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
  });

  const [issueFormData, setIssueFormData] = useState({
    item_id: "",
    quantity: "",
    recipient_type: "student",
    recipient_name: "",
    recipient_id: "",
    recipient_department: "",
    expected_return_date: "",
    purpose: "",
    notes: "",
  });

  const [returnFormData, setReturnFormData] = useState({
    quantity_returned: "",
    condition: "good",
    remarks: "",
  });

  useEffect(() => {
    fetchIssues();
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);

      const response = await api.get(`/issues?${params.toString()}`);
      setIssues(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch issues");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchItems = async () => {
    try {
      const response = await api.get("/items?limit=1000");
      setItems(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  };

  const handleOpenIssueModal = () => {
    setIssueFormData({
      item_id: "",
      quantity: "",
      recipient_type: "student",
      recipient_name: "",
      recipient_id: "",
      recipient_department: "",
      expected_return_date: "",
      purpose: "",
      notes: "",
    });
    setShowIssueModal(true);
  };

  const handleCloseIssueModal = () => {
    setShowIssueModal(false);
    setIssueFormData({
      item_id: "",
      quantity: "",
      recipient_type: "student",
      recipient_name: "",
      recipient_id: "",
      recipient_department: "",
      expected_return_date: "",
      purpose: "",
      notes: "",
    });
  };

  const handleOpenReturnModal = (issue) => {
    setSelectedIssue(issue);
    setReturnFormData({
      quantity_returned: issue.quantity,
      condition: "good",
      remarks: "",
    });
    setShowReturnModal(true);
  };

  const handleCloseReturnModal = () => {
    setShowReturnModal(false);
    setSelectedIssue(null);
    setReturnFormData({
      quantity_returned: "",
      condition: "good",
      remarks: "",
    });
  };

  const handleItemChange = (e) => {
    const itemId = e.target.value;
    setIssueFormData({ ...issueFormData, item_id: itemId });

    // Find selected item to show available quantity
    const selectedItem = items.find((item) => item.id === parseInt(itemId));
    if (selectedItem) {
      console.log("Available quantity:", selectedItem.quantity_available);
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();

    try {
      await api.post("/issues", issueFormData);
      toast.success("Issue created successfully!");
      handleCloseIssueModal();
      fetchIssues();
      fetchItems(); // Refresh items to update available quantities
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create issue");
      console.error(error);
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();

    try {
      await api.post(`/issues/${selectedIssue.id}/return`, returnFormData);
      toast.success("Return processed successfully!");
      handleCloseReturnModal();
      fetchIssues();
      fetchItems(); // Refresh items to update available quantities
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process return");
      console.error(error);
    }
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center gap-1">
          <FiAlertCircle /> Overdue
        </span>
      );
    }

    const statusStyles = {
      issued: "bg-blue-100 text-blue-800",
      partial_return: "bg-yellow-100 text-yellow-800",
      returned: "bg-green-100 text-green-800",
    };

    const statusText = {
      issued: "Issued",
      partial_return: "Partial Return",
      returned: "Returned",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          statusStyles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusText[status] || status}
      </span>
    );
  };

  const activeIssues = issues.filter((issue) => issue.status === "issued");
  const recentReturns = issues.filter((issue) => issue.status === "returned");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Issues & Returns</h1>
        <button
          onClick={handleOpenIssueModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <FiPlus /> New Issue
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="issued">Issued</option>
          <option value="partial_return">Partial Return</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Active Issues</p>
              <p className="text-3xl font-bold text-blue-700">
                {activeIssues.length}
              </p>
            </div>
            <FiPackage className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">
                Partial Returns
              </p>
              <p className="text-3xl font-bold text-yellow-700">
                {issues.filter((i) => i.status === "partial_return").length}
              </p>
            </div>
            <FiAlertCircle className="text-4xl text-yellow-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">
                Completed Returns
              </p>
              <p className="text-3xl font-bold text-green-700">
                {recentReturns.length}
              </p>
            </div>
            <FiCheckCircle className="text-4xl text-green-500" />
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">All Issues</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : issues.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No issues found. Click "New Issue" to create one.
          </div>
        ) : (
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
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {issue.issue_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {issue.item_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {issue.item_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {issue.recipient_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {issue.recipient_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(issue.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(issue.status, issue.is_overdue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {issue.status !== "returned" && (
                        <button
                          onClick={() => handleOpenReturnModal(issue)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Process Return
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create New Issue</h2>
                <button
                  onClick={handleCloseIssueModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitIssue} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item *
                    </label>
                    <select
                      required
                      value={issueFormData.item_id}
                      onChange={handleItemChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Item</option>
                      {items
                        .filter((item) => item.quantity_available > 0)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.item_code}) - Available:{" "}
                            {item.quantity_available}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={issueFormData.quantity}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          quantity: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Type *
                    </label>
                    <select
                      required
                      value={issueFormData.recipient_type}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          recipient_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="staff">Staff</option>
                      <option value="department">Department</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={issueFormData.recipient_name}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          recipient_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient ID
                    </label>
                    <input
                      type="text"
                      value={issueFormData.recipient_id}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          recipient_id: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., CS2021001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Department
                    </label>
                    <input
                      type="text"
                      value={issueFormData.recipient_department}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          recipient_department: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Computer Science"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Return Date
                    </label>
                    <input
                      type="date"
                      value={issueFormData.expected_return_date}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          expected_return_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purpose
                    </label>
                    <input
                      type="text"
                      value={issueFormData.purpose}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          purpose: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Final Year Project"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows="3"
                      value={issueFormData.notes}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseIssueModal}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create Issue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Process Return</h2>
                <button
                  onClick={handleCloseReturnModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Issue No:</p>
                <p className="font-semibold">{selectedIssue.issue_no}</p>
                <p className="text-sm text-gray-600 mt-2">Item:</p>
                <p className="font-semibold">{selectedIssue.item_name}</p>
                <p className="text-sm text-gray-600 mt-2">Issued Quantity:</p>
                <p className="font-semibold">{selectedIssue.quantity}</p>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Returned *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedIssue.quantity}
                    value={returnFormData.quantity_returned}
                    onChange={(e) =>
                      setReturnFormData({
                        ...returnFormData,
                        quantity_returned: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    required
                    value={returnFormData.condition}
                    onChange={(e) =>
                      setReturnFormData({
                        ...returnFormData,
                        condition: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    rows="3"
                    value={returnFormData.remarks}
                    onChange={(e) =>
                      setReturnFormData({
                        ...returnFormData,
                        remarks: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseReturnModal}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Process Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;
