import { sendEmail } from "../lib/email.js";
import { getSetting } from "../lib/settings.js";

/**
 * Sends an OTP verification email.
 * @param to Recipient's email
 * @param otp 6-digit OTP code
 * @param name Recipient's name (optional)
 * @returns boolean indicating success
 */
export const sendOtpEmail = async (
  to: string,
  otp: string,
  name: string = "User",
): Promise<boolean> => {
  const orgName = (await getSetting("org_name")) || "Online Exam Platform";
  const subject = `${orgName}: Email Verification`;

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f7fb; padding: 40px 20px;">
    <div
      style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #3098bb, #3ca0c2); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">
          KYP5
        </h1>
        <p style="color: #dbe6ff; margin-top: 8px; font-size: 14px;">
          Secure Exam & Verification Portal
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #222222; margin-top: 0; font-size: 24px;">
          Email Verification
        </h2>

        <p style="color: #555555; font-size: 16px; line-height: 1.7;">
          Hello <strong>${name}</strong>,
        </p>

        <p style="color: #555555; font-size: 16px; line-height: 1.7;">
          Thank you for registering on <strong>KYP5</strong>. To complete your email verification, please use the
          One-Time Password (OTP) below:
        </p>

        <!-- OTP Box -->
        <div style="text-align: center; margin: 35px 0;">
          <div
            style="display: inline-block; background: #f8fbff; border: 2px dashed #3098bb; border-radius: 12px; padding: 18px 35px;">
            <span style="font-size: 36px; font-weight: bold; color: #3098bb; letter-spacing: 8px;">
              ${otp}
            </span>
          </div>
        </div>

        <p style="color: #555555; font-size: 15px; line-height: 1.7;">
          This OTP is valid for <strong>10 minutes</strong>. For your security, please do not share this code with
          anyone.
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.7;">
          If you did not request this verification, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f4f7fb; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
        <p style="margin: 0; color: #888888; font-size: 13px;">
          © ${new Date().getFullYear()} KYP5. All rights reserved.
        </p>
        <p style="margin-top: 6px; color: #aaaaaa; font-size: 12px;">
          This is an automated email. Please do not reply.
        </p>
      </div>

    </div>
  </div>
  `;

  return sendEmail(to, subject, html);
};
