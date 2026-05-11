import { transporter } from "../config/mailer.js";

export const sendEmail = async (email, otp) => {
  let info = await transporter.sendMail({
    from: `"AgroMitra" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "AgroMitra OTP Verification",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    html: `<h3>Welcome to AgroMitra!</h3><p>Your OTP for registration is <b>${otp}</b>.</p><p>It is valid for 5 minutes.</p>`,
  });
  console.log("Email sent successfully");
};

export const sendOtpEmail = sendEmail;
