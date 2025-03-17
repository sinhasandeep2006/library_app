import db from "../db.js";

// Create a new user
export const createUser = async (name, email, password, role = "User") => {
  const [result] = await db.execute(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, role]
  );
  return result.insertId; // Return new user's ID
};

// Get a user by email
export const getUserByEmail = async (email) => {
  const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
    email,
  ]);
  return rows[0]; // Return the first found user
};
