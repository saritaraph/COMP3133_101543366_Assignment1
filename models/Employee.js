import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: [true, "first_name is required"] },
    last_name: { type: String, required: [true, "last_name is required"] },
    email: { type: String, required: [true, "email is required"], unique: true, lowercase: true },

    gender: {
      type: String,
      enum: { values: ["Male", "Female", "Other"], message: "Gender must be Male/Female/Other" }
    },

    designation: { type: String, required: [true, "designation is required"] },
    // Salary validation (must be >= 1000)
    salary: { type: Number, required: [true, "salary is required"], min: [1000, "salary must be >= 1000"] },
    date_of_joining: { type: Date, required: [true, "date_of_joining is required"] },
    department: { type: String, required: [true, "department is required"] },

    // Cloudinary URL
    employee_photo: { type: String }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);
// Create Employee model from schema
const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;