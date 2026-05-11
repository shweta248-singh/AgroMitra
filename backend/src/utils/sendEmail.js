import { sendMail } from "../config/mailer.js";

export const sendEmail = async (email, otp) => {
  try {
    const info = await sendMail({
      to: email,
      subject: "AgroMitra OTP Verification",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      html: `
        <h2>Welcome to AgroMitra!</h2>
        <p>Your OTP for registration is:</p>
        <h1 style="letter-spacing:4px;">${otp}</h1>
        <p>This OTP is valid for 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

export const sendOtpEmail = sendEmail;