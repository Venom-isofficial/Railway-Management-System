import React from "react";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <p className="mt-1 text-lg">{user?.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <p className="mt-1 text-lg">{user?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <p className="mt-1">
              <span className="badge badge-info capitalize">{user?.role}</span>
            </p>
          </div>

          {user?.department && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <p className="mt-1 text-lg">{user.department.name}</p>
            </div>
          )}

          <div className="pt-4">
            <button className="btn-primary">Edit Profile</button>
            <button className="btn-secondary ml-4">Change Password</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
