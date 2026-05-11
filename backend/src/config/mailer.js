// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// export const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: process.env.SMTP_PORT,
//   secure: true,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// import dns from "node:dns";

// dotenv.config();

// dns.setDefaultResultOrder("ipv4first");

// const smtpPort = Number(process.env.SMTP_PORT || 465);

// export const transporter = nodemailer.createTransport({
//   service: "gmail",
//   host: "smtp.gmail.com",
//   port: smtpPort,
//   secure: smtpPort === 465,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
//   connectionTimeout: 60000,
//   greetingTimeout: 60000,
//   socketTimeout: 60000,
// });

// export const sendMail = async ({ to, subject, html, text }) => {
//   return transporter.sendMail({
//     from: `"AgroMitra" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
//     to,
//     subject,
//     html,
//     text,
//   });
// };

// transporter.verify((error) => {
//   if (error) {
//     console.error("SMTP ERROR:", error.message);
//   } else {
//     console.log("SMTP SERVER IS READY ✅");
//   }
// });


import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,

  port: Number(process.env.SMTP_PORT || 587),

  secure: false,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  requireTLS: true,

  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000,
});

// Verify SMTP connection
transporter.verify((error) => {
  if (error) {
    console.error("SMTP ERROR:", error.message);
  } else {
    console.log("SMTP SERVER IS READY ✅");
  }
});

// Reusable sendMail function
export const sendMail = async ({
  to,
  subject,
  html,
  text,
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"AgroMitra" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });

    console.log("Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("Send mail error:", error.message);
    throw error;
  }
};