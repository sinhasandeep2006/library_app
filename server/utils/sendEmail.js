import { generateVerifivstionOtpEmailTemplate } from "./emailTempletes.js"
import { sendEmail } from "./utileemail.js"
export async function sendVerificationCode(verificationCode, email) {
    try {
        console.log("📨 Sending email to:", email);
        console.log("📨 Verification Code:", verificationCode);

        const message = generateVerifivstionOtpEmailTemplate (verificationCode);
        
        await sendEmail({
            email,
            subject: "Verification Code",
            message,
        });

        console.log("✅ Email sent successfully to:", email);
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw new Error("Verification code failed to send");
    }
}
