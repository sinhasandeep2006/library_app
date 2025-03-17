import { db } from "../database/db.js"; // MySQL connection
import { catchAsyncError } from "../middleware/catchAsyncerror.js";
import ErrorHandler from "../middleware/errorMiddleware.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sendVerificationCode } from "../utils/sendEmail.js";
import { generateVerificationCode } from "../utils/authUtils.js";
import { sendToken } from "../utils/SendToken.js";
// 🛠 Register User
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Enter the name, email, and password.", 400));
  }

  // Check if user already exists
  const [existingUser] = await db.execute(
    "SELECT * FROM users WHERE email = ? AND accountVerified = ?",
    [email, true]
  );
  // if (existingUser.length) {
  //   return next(new ErrorHandler("User already exists", 400));
  // }

  // Check for unverified users
  const [registrationAttemptsByUser] = await db.execute(
    "SELECT * FROM users WHERE email = ? AND accountVerified = ?",
    [email, false]
  );
  if (registrationAttemptsByUser.length >= 5) {
    return next(
      new ErrorHandler(
        "You have exceeded the number of registration attempts. Please contact support.",
        400
      )
    );
  }

  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into MySQL database
  const [result] = await db.execute(
    "INSERT INTO users (name, email, password, accountVerified) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, false]
  );

  const userId = result.insertId;
  const { verificationCode, verificationCodeExpire } =
    generateVerificationCode();

  // Store Verification Code in the Database
  const [updateResult] = await db.execute(
    "UPDATE users SET verificationCode = ?, verificationCodeExpire = ? WHERE id = ?",
    [verificationCode, verificationCodeExpire, userId]
  );
  console.log("Update Result:", updateResult);

  // Send verification code via email
  try {
    await sendVerificationCode(verificationCode, email);
  } catch (error) {
    return next(new ErrorHandler("Verification code failed to send", 500));
  }

  res.status(201).json({
    success: true,
    message: "User registered successfully. Please verify your email.",
  });
});

// verify OTP

export const verifyOTP = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new ErrorHandler("Enter all the data!!"));
  }
  try {
    // Fetch all unverified accounts (without LIMIT 1)
    const [userAllEnteries] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND accountVerified = ? ORDER BY created_at DESC",
      [email, false]
    );

    console.log(`Entries found for ${email}:`, userAllEnteries.length);

    if (userAllEnteries.length === 0) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Get latest entry (newest)
    const user = userAllEnteries[0];
    // Check if verificationCodeExpire exists
    if (!user.verificationCodeExpire) {
      return next(new ErrorHandler("OTP expiration time not found", 400));
    }
    // Delete older unverified entries
    if (userAllEnteries.length > 1) {
      console.log(`Deleting old entries for ${email}, keeping user ID: ${user.id}`);
      
      const [deleteResult] = await db.execute(
        "DELETE FROM users WHERE email = ? AND accountVerified = ? AND id != ?",
        [email, false, user.id]
      );

      console.log("Delete Result:", deleteResult);
    }

    // Compare OTP
    if (Number(user.verificationCode)!== Number(otp)) {
      return next(new ErrorHandler("Invalid OTP", 400));
    }

    // Check expiration
    const currentTime = Date.now();
    const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();

    console.log("Current Time:", new Date(currentTime).toISOString());
console.log("OTP Expiry Time:", new Date(verificationCodeExpire).toISOString());

    if (currentTime > verificationCodeExpire) {
    
      return next(new ErrorHandler("OTP expired", 400));
      
    }
    

    // Update user to verified
    await db.execute(
      "UPDATE users SET accountVerified = ?, verificationCode = ?, verificationCodeExpire = ? WHERE id = ?",
      [true, null, null, user.id]
    );

    // Send token
    sendToken(user, 200, "Account verified", res);
  } catch (error) {
        console.error("Unexpected Error in verifyOTP:", error);
        return next(new ErrorHandler("Internal server error", 500));
      }
});

// export const verifyOTP = catchAsyncError(async (req, res, next) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) {
//     return next(new ErrorHandler("Enter all the data!!"));
//   }

//   try {
//     const [userAllEnteries] = await db.execute(
//       "SELECT * FROM users WHERE email = ? AND accountVerified = ? ORDER BY created_at DESC",
//       [email, false]
//     );

//     console.log(`Entries found for ${email}:`, userAllEnteries.length);

//     if (userAllEnteries.length === 0) {
//       return next(new ErrorHandler("User not found", 404));
//     }

//     const user = userAllEnteries[0];

//     if (!user.verificationCodeExpire) {
//       return next(new ErrorHandler("OTP expiration time not found", 400));
//     }

//     if (userAllEnteries.length > 1) {
//       console.log(`Deleting old entries for ${email}, keeping user ID: ${user.id}`);

//       try {
//         const [deleteResult] = await db.execute(
//           "DELETE FROM users WHERE email = ? AND accountVerified = ? AND id != ?",
//           [email, false, user.id]
//         );
//         console.log("Delete Result:", deleteResult);
//       } catch (err) {
//         console.error("Error deleting old unverified users:", err);
//       }
//     }

//     if (Number(user.verificationCode) !== Number(otp)) {
//       return next(new ErrorHandler("Invalid OTP", 400));
//     }

//     const currentTime = Date.now();
//     const verificationCodeExpire = new Date(user.verificationCodeExpire).getTime();

//     console.log("Current Time:", new Date(currentTime).toISOString());
//     console.log("OTP Expiry Time:", new Date(verificationCodeExpire).toISOString());

//     if (currentTime > verificationCodeExpire) {
//       return next(new ErrorHandler("OTP expired", 400));
//     }

//     try {
//       await db.execute(
//         "UPDATE users SET accountVerified = ?, verificationCode = ?, verificationCodeExpire = ? WHERE id = ?",
//         [true, null, null, user.id]
//       );
//     } catch (err) {
//       console.error("Error updating user verification status:", err);
//       return next(new ErrorHandler("Database update failed", 500));
//     }

//     sendToken(user, 200, "Account verified", res);
//   } catch (error) {
//     console.error("Unexpected Error in verifyOTP:", error);
//     return next(new ErrorHandler("Internal server error", 500));
//   }
// });












// 🔑 Generate Password Reset Token
// export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
//   const { email } = req.body;

//   // Check if user exists
//   const [user] = await db.execute("SELECT * FROM users WHERE email = ?", [
//     email,
//   ]);
//   if (!user.length) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   // Generate reset token
//   const resetToken = crypto.randomBytes(32).toString("hex");
//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");
//   const expireTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

//   // Store token in MySQL
//   await db.execute(
//     "UPDATE users SET resetPasswordToken = ?, resetPasswordExpire = ? WHERE email = ?",
//     [hashedToken, expireTime, email]
//   );

//   // Send token via email (Implement your email service here)
//   res
//     .status(200)
//     .json({ success: true, message: "Reset token sent", token: resetToken });
// });

// 🔍 Verify Password Reset Token
// export const verifyResetToken = catchAsyncErrors(async (req, res, next) => {
//   const { token } = req.params;

//   // Hash token to compare with the stored hash
//   const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//   // Check token in database
//   const [user] = await db.execute(
//     "SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpire > NOW()",
//     [hashedToken]
//   );

//   if (!user.length) {
//     return next(new ErrorHandler("Invalid or expired token", 400));
//   }

//   res.status(200).json({ success: true, message: "Token is valid" });
// });

// // 🔑 Reset Password
// export const resetPassword = catchAsyncErrors(async (req, res, next) => {
//   const { token } = req.params;
//   const { newPassword } = req.body;

//   const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//   // Find user with valid token
//   const [user] = await db.execute(
//     "SELECT * FROM users WHERE resetPasswordToken = ? AND resetPasswordExpire > NOW()",
//     [hashedToken]
//   );

//   if (!user.length) {
//     return next(new ErrorHandler("Invalid or expired token", 400));
//   }

//   // Hash new password
//   const hashedPassword = await bcrypt.hash(newPassword, 10);

//   // Update password in MySQL
//   await db.execute(
//     "UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpire = NULL WHERE email = ?",
//     [hashedPassword, user[0].email]
//   );

//   res
//     .status(200)
//     .json({ success: true, message: "Password reset successfully" });
// });
