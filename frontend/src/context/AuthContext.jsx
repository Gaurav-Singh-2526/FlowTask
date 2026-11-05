import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [teamUsers, setTeamUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("flowtask_auth_user_v2");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  // Load team roster scoped strictly to the current user's team leader
  const refreshTeamUsers = async () => {
    if (!currentUser) {
      setTeamUsers([]);
      return;
    }
    const targetLeaderId = currentUser.role === "Team Leader" ? currentUser.id : currentUser.leader_id;
    if (!targetLeaderId) {
      setTeamUsers([]);
      return;
    }
    try {
      const users = await api.listUsers(targetLeaderId);
      setTeamUsers(users);
    } catch (_) {
      setTeamUsers([]);
    }
  };

  useEffect(() => {
    refreshTeamUsers();
  }, [currentUser?.id, currentUser?.role, currentUser?.leader_id]);

  const login = async (email, password = null) => {
    if (!email || !email.trim()) {
      return { success: false, error: "Please enter your email." };
    }
    if (!password) {
      return { success: false, error: "Please enter your password." };
    }

    try {
      const user = await api.login(email.trim(), password);
      setCurrentUser(user);
      localStorage.setItem("flowtask_auth_user_v2", JSON.stringify(user));
      return { success: true, user };
    } catch (err) {
      return { success: false, error: err.message || "Invalid credentials." };
    }
  };

  const register = async ({ name, email, password, role, title, color }) => {
    if (!name || !name.trim() || !email || !email.trim()) {
      return { success: false, error: "Name and email are required." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    try {
      const assignedRole = role || "Team Leader";
      const newUser = await api.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: assignedRole,
        title: title || (assignedRole === "Team Leader" ? "Team Leader" : "Team Member"),
        color: color || (assignedRole === "Team Leader" ? "av-blue" : "av-green"),
        leader_id: null
      });

      setCurrentUser(newUser);
      localStorage.setItem("flowtask_auth_user_v2", JSON.stringify(newUser));
      setTeamUsers([]);
      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, error: err.message || "Registration failed." };
    }
  };

  const switchUser = (user) => {
    if (!user) return;
    setCurrentUser(user);
    localStorage.setItem("flowtask_auth_user_v2", JSON.stringify(user));
  };

  const addTeamMember = async ({ name, email, password = "password123", title = "Engineer", color = "av-green", project_ids = [] }) => {
    if (!currentUser || currentUser.role !== "Team Leader") {
      alert("Permission Denied: Only Team Leaders can add team members.");
      return null;
    }

    try {
      const newUser = await api.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password || "password123",
        role: "Team Member",
        title: title || "Engineer",
        color: color || "av-green",
        leader_id: currentUser.id,
        project_ids: project_ids || []
      });

      await refreshTeamUsers();
      return newUser;
    } catch (err) {
      alert(`Error creating team member: ${err.message}`);
      return null;
    }
  };

  const updateTeamMember = async (userId, data) => {
    try {
      const updated = await api.updateUser(userId, data, currentUser?.id);
      await refreshTeamUsers();
      return updated;
    } catch (err) {
      alert(`Error updating team member: ${err.message}`);
      return null;
    }
  };

  const removeTeamMember = async (userId) => {
    if (!currentUser || currentUser.role !== "Team Leader") {
      alert("Permission Denied: Only Team Leaders can remove team members.");
      return false;
    }

    try {
      await api.deleteUser(userId);
      await refreshTeamUsers();
      return true;
    } catch (err) {
      alert(`Error removing team member: ${err.message}`);
      return false;
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!currentUser) return { success: false, error: "Not logged in" };
    try {
      const updated = await api.updateUserProfile(currentUser.id, profileData, currentUser.id);
      if (updated) {
        setCurrentUser(updated);
        localStorage.setItem("flowtask_auth_user_v2", JSON.stringify(updated));
        await refreshTeamUsers();
        return { success: true, user: updated };
      }
      return { success: false, error: "Failed to update profile" };
    } catch (err) {
      return { success: false, error: err.message || "Failed to update profile" };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setTeamUsers([]);
    localStorage.removeItem("flowtask_auth_user_v2");
  };

  const isTeamLeader = currentUser?.role === "Team Leader";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isTeamLeader,
        teamUsers,
        login,
        register,
        switchUser,
        updateUserProfile,
        addTeamMember,
        updateTeamMember,
        removeTeamMember,
        refreshTeamUsers,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
