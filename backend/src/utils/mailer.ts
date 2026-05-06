import { sendEmail } from "../lib/email.js";
import { getSetting } from "../lib/settings.js";

/**
 * Sends an OTP verification email.
 * @param to Recipient's email
 * @param otp 6-digit OTP code
 * @param name Recipient's name (optional)
 * @returns boolean indicating success
 */
export const sendOtpEmail = async (to: string, otp: string, name: string = "User"): Promise<boolean> => {
  const orgName = (await getSetting("org_name")) || "Online Exam Platform";
  const subject = `${orgName}: Your OTP Verification Code`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">OTP Verification</h2>
      <p style="color: #555; font-size: 16px;">Hello ${name},</p>
      <p style="color: #555; font-size: 16px;">Your One-Time Password (OTP) for verification is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; padding: 10px 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px dashed #4CAF50;">
          ${otp}
        </span>
      </div>
      <p style="color: #555; font-size: 16px;">This OTP is valid for the next 10 minutes. Please do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">If you did not request this OTP, please ignore this email.</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};
