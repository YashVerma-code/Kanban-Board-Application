import { useEffect, useState } from "react";
import {
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  X,
  User,
} from "lucide-react";
import TaskForm from "../TaskForm/TaskForm";
import { useBoardStore } from "../../stores/useBoardStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useAuthStore } from "../../stores/useAuthStore";
import "./boardcontainer.css";
import { toast } from "sonner";

export default function BoardContainer() {
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTask, setReassignTask] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");

  const {
    setTasks, activeTasks, todoTasks, completedTasks, draggingTask, setDraggingTask, changeStatus, updateTask,
    isUpdatingTask, removeTask, unlockTask, lockTask } = useTaskStore();
  const { availableBoardMembers, fetchboardMembers, selectedBoard } =
    useBoardStore();

  useEffect(() => {
    if (!selectedBoard) return;
    setTasks();
    fetchboardMembers();
  }, [selectedBoard]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (taskMenuOpen && !event.target.closest(".task-menu-container")) {
        setTaskMenuOpen(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [taskMenuOpen]);

  const handleDrop = async (event, key) => {
    event.preventDefault();
    if (!draggingTask) return;
    if (draggingTask.status === key) return;
    const locked = await lockTask(draggingTask._id);   // acquire lock first
    if (!locked) {
      toast.warning("Task is upadating by user!");
      return;
    }
    await changeStatus(
      { status: key, boardId: selectedBoard._id },
      draggingTask._id
    );
    setTasks();
  };

  const handleDragOver = async (event) => {
    event.preventDefault();
  };

  const handleEditTask = async (task) => {
    const locked = await lockTask(task._id);   // acquire lock first
    if (!locked) return;
    setEditingTask(task);
    setShowEditTask(true);
    setTaskMenuOpen(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await removeTask(taskId);
    }
    setTaskMenuOpen(null);
  };

  const handleReassignTask = (task) => {
    setReassignTask(task);
    setSelectedAssignee(task.assignedTo._id);
    setShowReassignModal(true);
    setTaskMenuOpen(null);
  };

  const handleReassignSubmit = async () => {
    if (!selectedAssignee || !reassignTask) return;

    const updatedTask = {
      ...reassignTask,
      assignedTo: selectedAssignee,
    };

    await updateTask(updatedTask, reassignTask._id);
    setShowReassignModal(false);
    setReassignTask(null);
    setSelectedAssignee("");
  };

  const columns = {
    todo: todoTasks ?? [],
    "in-progress": activeTasks ?? [],
    done: completedTasks ?? [],
  };

  const getColumnConfig = (key) => {
    const configs = {
      todo: {
        title: "To Do",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgba(59, 130, 246, 0.2)",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8V12L16 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      "in-progress": {
        title: "In Progress",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
        borderColor: "rgba(245, 158, 11, 0.2)",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 6V12L16 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      done: {
        title: "Done",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "rgba(16, 185, 129, 0.2)",
        icon: (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M9 12L11 14L15 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    };
    return configs[key] || configs.todo;
  };

  if (!selectedBoard) {
    return (
      <section className="right-board-container">
        <div className="board-container empty">
          <div className="empty-state">
            <div className="empty-icon">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="3"
                  width="7"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                />
                <rect
                  x="14"
                  y="3"
                  width="7"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.3"
                />
                <rect
                  x="5"
                  y="6"
                  width="3"
                  height="2"
                  rx="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <rect
                  x="5"
                  y="10"
                  width="3"
                  height="2"
                  rx="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <rect
                  x="16"
                  y="6"
                  width="3"
                  height="2"
                  rx="1"
                  fill="currentColor"
                  opacity="0.2"
                />
                <rect
                  x="16"
                  y="10"
                  width="3"
                  height="2"
                  rx="1"
                  fill="currentColor"
                  opacity="0.2"
                />
              </svg>
            </div>
            <h3 className="empty-title">Ready to get organized?</h3>
            <p className="empty-text">
              Select a board from the sidebar to start managing your tasks
            </p>
            <div className="empty-hint">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Create boards to organize your workflow</span>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="right-board-container">
      <div className="board-container">
        <header className="board-header">
          <div className="board-header-content">
            <h1 className="board-title">{selectedBoard.name.toUpperCase()}</h1>
            <div className="board-stats">
              <div className="stat">
                <span className="stat-number">
                  {selectedBoard.tasks.length}
                </span>
                <span className="stat-label">Total Tasks</span>
              </div>
              <div className="stat green">
                <span className="stat-number green">
                  {completedTasks?.length || 0}
                </span>
                <span className="stat-label green">Completed</span>
              </div>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className="add-task-btn"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
          <div className="board-header-member">
            <h1 className="board-title-member">Members</h1>
            <div className="board-member-avatar">
              {availableBoardMembers.map((member) =>
                member?.profilePic ? (
                  <div className="box" key={member._id}>
                    <img
                      key={member._id || member.id} // Make sure to use a unique key
                      src={member.profilePic}
                      alt="Profile"
                      className="profile-avatar"
                    />
                    <span>
                      {member.fullName.length > 4
                        ? `${member.fullName.slice(0, 4)}...`
                        : member.fullName}
                    </span>
                  </div>
                ) : (
                  <div className="box" key={member._id}>
                    <div
                      key={member._id || member.id}
                      className="profile-avatar-default"
                    >
                      <User />
                    </div>
                    <span>
                      {member.fullName.length > 5
                        ? `${member.fullName.toLowerCase().slice(0, 3)}...`
                        : member.fullName.toLowerCase()}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </header>

        <div className="columns">
          {Object.entries(columns).map(([key, tasks], index) => {
            const config = getColumnConfig(key);
            return (
              <div
                key={key}
                className="column"
                style={{
                  background: config.bgColor,
                  borderColor: config.borderColor,
                  animationDelay: `${index * 0.1}s`,
                }}
                onDrop={(event) => handleDrop(event, key)}
              >
                <div className="column-header">
                  <div className="column-title-wrapper">
                    <div
                      className="column-icon"
                      style={{ color: config.color }}
                    >
                      {config.icon}
                    </div>
                    <h4 className="column-title">{config.title}</h4>
                  </div>
                  <div
                    className="task-count"
                    style={{ backgroundColor: config.color }}
                  >
                    {tasks.length}
                  </div>
                </div>

                <div className="tasks-container" onDragOver={handleDragOver}>
                  {tasks.length ? (
                    tasks.map((task, taskIndex) => (
                      <div
                        key={task._id}
                        className="task"
                        style={{
                          animationDelay: `${index * 0.1 + taskIndex * 0.05}s`,
                        }}
                        draggable
                        onDragStart={() => setDraggingTask(task)}
                        onDragEnd={() => setDraggingTask(null)}
                      >
                        <div className="task-content">
                          <div className="task-header">
                            <div className="task-title">{task.title}</div>
                            <div className="task-menu-container">
                              <button
                                className="task-menu-trigger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskMenuOpen(
                                    taskMenuOpen === task._id ? null : task._id
                                  );
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {taskMenuOpen === task._id && (
                                <div className="task-menu">
                                  <button
                                    className="task-menu-item"
                                    onClick={() => handleEditTask(task)}
                                  >
                                    <Edit2 size={14} />
                                    Edit
                                  </button>
                                  <button
                                    className="task-menu-item"
                                    onClick={() => handleReassignTask(task)}
                                  >
                                    <UserCheck size={14} />
                                    Reassign
                                  </button>
                                  <button
                                    className="task-menu-item delete"
                                    onClick={() => handleDeleteTask(task._id)}
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="task-meta">
                            <div className="task-id">#{task._id}</div>
                            <div className="task-description">
                              <i>Description :</i> {task.description}
                            </div>
                            <div className="task-priority-content">
                              <i>Priority : </i> {task.priority}
                            </div>
                            <div className="task-assignedTo">
                              <i>Assigned to : </i>
                              {task?.assignedTo?.fullName || "Unassigned"}
                            </div>
                            <div
                              className="task-priority"
                              style={{ backgroundColor: config.color }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="3"
                                  fill="currentColor"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="placeholder">
                      <div
                        className="placeholder-icon"
                        style={{ color: config.color }}
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 5V19M5 12H19"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.3"
                          />
                        </svg>
                      </div>
                      <p className="placeholder-text">No tasks yet</p>
                      <p className="placeholder-hint">Drop tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && <TaskForm setShowTaskAdd={setShowAddTask} />}

      {/* Edit Task Modal */}
      {showEditTask && (
        <TaskForm
          setShowTaskAdd={async (val) => {
            await unlockTask(editingTask._id);   // release lock on close
            setShowEditTask(val);
          }}
          editingTask={editingTask}
          isEditing={true}
        />
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowReassignModal(false)}
        >
          <div
            className="modal-content reassign-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Reassign Task</h3>
                <p className="modal-subtitle">
                  Reassign "{reassignTask?.title}" to another team member
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowReassignModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="reassign-content">
              <div className="form-group">
                <label className="form-label">Select Team Member</label>
                <select
                  className="form-select"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                >
                  {availableBoardMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="button-group">
                <button
                  className="submit-button"
                  onClick={handleReassignSubmit}
                  disabled={isUpdatingTask || !selectedAssignee}
                >
                  {isUpdatingTask ? "Reassigning..." : "Reassign Task"}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setShowReassignModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
