import React, { useEffect, useState } from "react";
import "./taskform.css";
import { useTaskStore } from "../../stores/useTaskStore";
import { useBoardStore } from "../../stores/useBoardStore";
import { useAuthStore } from "../../stores/useAuthStore";

const TaskForm = ({
  setShowTaskAdd,
  editingTask = null,
  isEditing = false,
}) => {
  const { availableBoardMembers,fetchboardMembers ,selectedBoard } = useBoardStore();
  const {
    isCreatingTask,
    createTask,
    smartAssignUser,
    assignedUser,
    isSmartAssigning,
    setAssignedUser,updateTask,isUpdatingTask
  } = useTaskStore();
  const [formData, setFormData] = useState({
    title: editingTask?.title || "",
    description: editingTask?.description || "",
    priority: editingTask?.priority || "medium",
    status: editingTask?.status || "todo",
    boardId: selectedBoard._id,
    assignedTo: editingTask?.assignedTo?._id || assignedUser?._id || null,
    version: editingTask?.version ?? 1,
  });

  // Sync assignedUser from store with formData when it changes
  useEffect(() => {
    if (assignedUser?._id) {
      setFormData((prev) => ({
        ...prev,
        assignedTo: assignedUser._id,
      }));
    }
  }, [assignedUser]);

   useEffect(() => {
    if (selectedBoard) {
      fetchboardMembers();
    }
  }, [selectedBoard, fetchboardMembers]);

  useEffect(() => {
    if (isEditing && editingTask?.assignedTo) {
      setAssignedUser(editingTask.assignedTo);
    }
  }, [isEditing, editingTask]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isEditing) {
      await updateTask(formData,editingTask._id);
      // console.log("Updated task data:", formData);
    } else {
      await createTask(formData);
      // console.log("Created task data:", formData);
    }
    setShowTaskAdd(false);
    setAssignedUser(null); // Reset to null instead of empty string
  }

  function closeModal() {
    setShowTaskAdd(false);
    setAssignedUser(null); // Reset to null instead of empty string
  }

  function handleInputChange(field, value) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If manually selecting assignedTo, also update the store
    if (field === "assignedTo") {
      const selectedMember = availableBoardMembers.find(
        (member) => member._id === value
      );
      setAssignedUser(selectedMember || null);
    }
  }

  async function handleSmartAssign() {
    try {
      const assigned = await smartAssignUser(selectedBoard._id);

      if (assigned) {
        // console.log("Assigned user: ", assigned._id);
        // Update both form data and store state
        setFormData((prev) => ({
          ...prev,
          assignedTo: assigned._id,
        }));
        setAssignedUser(assigned);
      } else {
        // console.log("No assigned user");
        setFormData((prev) => ({
          ...prev,
          assignedTo: null,
        }));
        setAssignedUser(null);
      }
    } catch (error) {
      console.error("Smart assign failed:", error);
    }
  }

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {isEditing ? "Update Task" : "Create New Task"}
            </h3>
            <p className="modal-subtitle">
              Fill in the details to {isEditing ? "update" : "create a new"}{" "}
              task
            </p>
          </div>
          <button className="close-button" onClick={closeModal}>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form-container">
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              placeholder="Enter task title..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
              rows="4"
              placeholder="Describe the task in detail..."
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className={`form-select priority-${formData.priority}`}
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className={`form-select status-${formData.status}`}
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
              >
                <option value="todo">📋 To Do</option>
                <option value="in-progress">⚡ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign To</label>
            <div className="assign-group">
              <select
                className="assign-select"
                value={formData.assignedTo || ""}
                onChange={(e) =>
                  handleInputChange("assignedTo", e.target.value || null)
                }
              >
                <option value="">Select team member...</option>
                {availableBoardMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member?.fullName?.toUpperCase()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="smart-assign-button"
                onClick={handleSmartAssign}
                disabled={isSmartAssigning}
              >
                {isSmartAssigning ? (
                  <>
                    <span className="loading-spinner" />
                    Assigning...
                  </>
                ) : (
                  <>🤖 Smart Assign</>
                )}
              </button>
            </div>
            {formData.assignedTo && (
              <p className="assignment-confirmation">
                ✅ Assigned to{" "}
                {
                  availableBoardMembers.find((m) => m._id === formData.assignedTo)
                    ?.fullName
                }
              </p>
            )}
          </div>

          <div className="button-group">
            {isEditing ? (
              <button
                type="submit"
                className="submit-button"
                disabled={isUpdatingTask}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                {isUpdatingTask ? "Updating..." : "Update Task"}
              </button>
            ) : (
              <button
                type="submit"
                className="submit-button"
                disabled={isCreatingTask}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
                {isCreatingTask ? "Creating..." : "Create Task"}
              </button>
            )}
            <button
              type="button"
              className="cancel-button"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
