import mongoose, { Schema } from "mongoose";

const columnNames = ["todo", "in-progress", "done"];

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: Number,
      default: 1,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.pre("save", function (next) {
  this.lastModified = Date.now();
  next();
});

taskSchema.pre("validate", async function (next) {
  const titleLower = this.title.toLowerCase();

  if (columnNames.includes(titleLower)) {
    return next(new Error("Task title cannot match column names"));
  }
  const existingTask = await Task.findOne({
    boardId: this.boardId,
    title: this.title,
    _id: { $ne: this._id }
  });

  if (existingTask) {
    return next(new Error("Task title must be unique per board"));
  }

  next();
});

taskSchema.index(
  { boardId: 1, title: 1 },
  { unique: true }
);

taskSchema.index(
  { lockExpiresAt: 1 }
);

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

export default Task;