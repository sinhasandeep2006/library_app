import mysql from "mysql2/promise";

//  ===============creating the connections========================
export const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sinha123@gopal",
  database: "library",
});

console.log("mysql connecte successfully");