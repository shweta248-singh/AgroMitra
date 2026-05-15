import { sendMail } from "../config/mailer.js";

export const sendOtpEmail = async (email, otp) => {
  try {
    await sendMail({
      from: `"AgroMitra" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "AgroMitra OTP Verification",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>AgroMitra Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    });

    console.log("OTP EMAIL SENT SUCCESSFULLY ✅");
  } catch (error) {
    console.error("EMAIL SEND ERROR:", error.message);
    throw error;
  }
};