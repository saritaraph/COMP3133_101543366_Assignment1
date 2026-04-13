import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import cloudinary from "../config/cloudinary.js";

function toISO(doc) {
  const obj = doc.toObject();
  if (obj.created_at) obj.created_at = new Date(obj.created_at).toISOString();
  if (obj.updated_at) obj.updated_at = new Date(obj.updated_at).toISOString();
  if (obj.date_of_joining) obj.date_of_joining = new Date(obj.date_of_joining).toISOString();
  return obj;
}
// Upload employee photo to Cloudinary
async function uploadPhoto(photo) {
  if (!photo) return null;
  // photo can be a public URL OR base64 data URL
  const res = await cloudinary.uploader.upload(photo, {
    folder: "ems_employees",
    resource_type: "image",
  });
  return res.secure_url;
}

const resolvers = {
  Query: {
    login: async (_, { usernameOrEmail, password }) => {
      const user = await User.findOne({
        $or: [
          { username: usernameOrEmail },
          { email: usernameOrEmail.toLowerCase() },
        ],
      });

      if (!user) return { success: false, message: "Invalid login.", token: null, user: null };

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return { success: false, message: "Invalid login.", token: null, user: null };

      const token = jwt.sign(
        { sub: user._id.toString(), username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );

      return { success: true, message: "Login success.", token, user: toISO(user) };
    },
    // Get all employees
    getAllEmployees: async () => {
      const employees = await Employee.find().sort({ created_at: -1 });
      return { success: true, message: "Employees fetched.", employees: employees.map(toISO) };
    },
    // Search employee by employee id (eid)
    searchEmployeeByEid: async (_, { eid }) => {
      const emp = await Employee.findById(eid);
      if (!emp) return { success: false, message: "Employee not found.", employee: null };
      return { success: true, message: "Employee found.", employee: toISO(emp) };
    },
    // Search employees by designation and/or department
    searchEmployeeByDesignationOrDepartment: async (_, { designation, department }) => {
      const filter = { department };
      if (designation) filter.designation = designation;

      const employees = await Employee.find(filter).sort({ created_at: -1 });
      return { success: true, message: "Employees fetched.", employees: employees.map(toISO) };
    },
  },

  Mutation: {
    // Create a new user
    signup: async (_, { input }) => {
      const username = input.username.trim();
      const email = input.email.toLowerCase().trim();

      const exists = await User.findOne({ $or: [{ username }, { email }] });
      if (exists) return { success: false, message: "Username or email already exists.", user: null };

      const hash = await bcrypt.hash(input.password, 10);
      const user = await User.create({ username, email, password: hash });

      return { success: true, message: "Signup success.", user: toISO(user) };
    },

    addEmployee: async (_, { input }) => {
      if (input.salary < 1000) throw new Error("salary must be >= 1000");

      const email = input.email.toLowerCase().trim();
      const exists = await Employee.findOne({ email });
      if (exists) return { success: false, message: "Employee email already exists.", employee: null };

      const photoUrl = await uploadPhoto(input.employee_photo);

      const emp = await Employee.create({
        ...input,
        email,
        employee_photo: photoUrl,
        date_of_joining: new Date(input.date_of_joining),
      });

      return { success: true, message: "Employee created.", employee: toISO(emp) };
    },

    updateEmployeeByEid: async (_, { eid, input }) => {
      if (input.salary !== undefined && input.salary < 1000) throw new Error("salary must be >= 1000");

      if (input.email) input.email = input.email.toLowerCase().trim();
      if (input.employee_photo) input.employee_photo = await uploadPhoto(input.employee_photo);
      if (input.date_of_joining) input.date_of_joining = new Date(input.date_of_joining);

      const updated = await Employee.findByIdAndUpdate(eid, input, { new: true, runValidators: true });
      if (!updated) return { success: false, message: "Employee not found.", employee: null };

      return { success: true, message: "Employee updated.", employee: toISO(updated) };
    },

    // Delete employee by eid
    deleteEmployeeByEid: async (_, { eid }) => {
      const deleted = await Employee.findByIdAndDelete(eid);
      if (!deleted) return { success: false, message: "Employee not found.", employee: null };
      return { success: true, message: "Employee deleted.", employee: toISO(deleted) };
    },
  },
};

export default resolvers;