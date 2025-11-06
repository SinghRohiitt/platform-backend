import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

new Worker("email-queue", async (job) => {
  const { email, verifyUrl } = job.data;

  await resend.emails.send({
    from: "Verify <no-reply@yourapp.com>",
    to: email,
    subject: "Verify your account",
    html: `
      <h2>Welcome!</h2>
      <p>Click the link to verify:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
  });

  console.log("✅ Email sent to:", email);
}, {
  connection: { host: "127.0.0.1", port: 6379 }
});
