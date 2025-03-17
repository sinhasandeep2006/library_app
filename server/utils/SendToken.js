import { generateToken } from "./generateToken.js";

export const sendToken = (user, statusCode, message, res) => {
    const token = generateToken(user.id);

    // Convert COOKIE_EXPIRE to a number and then to milliseconds
    const cookieExpireDays = Number(process.env.COOKIE_EXPIRE) || 7; // Default to 7 days
    const cookieExpireTime = cookieExpireDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    res.status(statusCode)
        .cookie("token", token, {
            expires: new Date(Date.now() + cookieExpireTime), // Correct expiration format
            httpOnly: true,
        })
        .json({
            success: true,
            user,
            message,
            token,
        });
};
