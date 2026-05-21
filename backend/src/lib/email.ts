import nodemailer from "nodemailer";
import { getSetting, getSettingBoolean } from "./settings.js";
import logger from "../utils/logger.js";

/**
 * Create a nodemailer transport from system settings.
 */
async function createTransport() {
  const host = await getSetting("smtp_host");
  const port = parseInt(await getSetting("smtp_port"), 10) || 587;
  const user = await getSetting("smtp_user");
  const pass = await getSetting("smtp_password");

  if (!host || !user) {
    logger.warn("createTransport: Missing SMTP host or user", {
      host,
      user: user ? "***" : undefined,
    });
    return null;
  }

  logger.info(
    `createTransport: Initializing nodemailer with host=${host}, port=${port}, secure=${port === 465}, user=${user}`,
  );
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Send an email using system SMTP settings.
 * Returns silently if email is disabled or SMTP is not configured.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  try {
    const enabled = await getSettingBoolean("email_enabled");
    if (!enabled) {
      logger.warn(
        "sendEmail: Email is DISABLED via settings (email_enabled), skipping send",
      );
      return false;
    }

    const transport = await createTransport();
    if (!transport) {
      logger.warn("SMTP not configured, skipping email");
      return false;
    }

    const emailFrom = await getSetting("email_from");
    const smtpUser = await getSetting("smtp_user");
    const from = emailFrom || smtpUser || "noreply@example.com";

    if (!from) {
      logger.warn(
        "sendEmail: No from address configured (set email_from or smtp_user in Settings)",
      );
      return false;
    }

    logger.info(`Attempting to send email from ${from} to ${to}...`);

    await transport.sendMail({ from, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error: any) {
    logger.error(`Email send failed: ${error.message}`);
    return false;
  }
}

/**
 * Send a notification email to the admin (org_email).
 * Fire-and-forget — never blocks the caller.
 */
export async function sendAdminNotification(
  subject: string,
  html: string,
): Promise<void> {
  try {
    const notifyEnabled = await getSettingBoolean("notify_on_export_import");
    if (!notifyEnabled) {
      logger.debug(
        "sendAdminNotification: notify_on_export_import is false, skipping",
      );
      return;
    }

    const adminEmail = await getSetting("org_email");
    if (!adminEmail) {
      logger.warn("No org_email configured, skipping admin notification");
      return;
    }

    logger.info(`sendAdminNotification: Sending to admin email: ${adminEmail}`);
    // Fire-and-forget
    sendEmail(adminEmail, subject, html).catch((err) =>
      logger.error(`Admin notification failed: ${err.message}`),
    );
  } catch (error: any) {
    logger.error(`Admin notification check failed: ${error.message}`);
  }
}

/**
 * Specifically tests the SMTP connection and sends a test email.
 * Returns { success, error } for frontend UI feedback.
 */
export async function testSmtpConnection(
  to: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = await createTransport();
    if (!transport) {
      return {
        success: false,
        error:
          "SMTP settings (host, user, pass) are incomplete. Please check your settings.",
      };
    }

    // Specifically test the connection first
    try {
      await transport.verify();
    } catch (verifyError: any) {
      logger.error("SMTP Verify Error:", verifyError);
      return {
        success: false,
        error: `SMTP Connection failed: ${verifyError.message}`,
      };
    }

    const emailFrom = await getSetting("email_from");
    const smtpUser = await getSetting("smtp_user");
    const from = emailFrom || smtpUser || "noreply@example.com";

    const orgName = (await getSetting("org_name")) || "Online Exam Platform";

    await transport.sendMail({
      from,
      to,
      subject: `${orgName}: SMTP Configuration `,
      html: `
            <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f7fb; padding: 40px 20px;">

        <div
            style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #11998e, #38ef7d); padding: 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">
                    SMTP Test Email
                </h1>
                <p style="margin-top: 8px; color: #eafff5; font-size: 14px;">
                    Email Configuration Verification
                </p>
            </div>

            <!-- Body -->
            <div style="padding: 40px 30px;">

                <div style="text-align: center; margin-bottom: 25px;">
                    <div
                        style="display: inline-block; background: #e9fff4; border-radius: 50%; width: 70px; height: 70px; line-height: 70px; font-size: 36px;">
✓
                    </div>
                </div>

                <h2 style="color: #222222; text-align: center; margin-top: 0;">
                    SMTP Configuration Successful
                </h2>

                <p style="color: #555555; font-size: 16px; line-height: 1.7; text-align: center;">
                    Your <strong>${orgName}</strong> email settings have been configured successfully.
                </p>

                <p style="color: #555555; font-size: 15px; line-height: 1.7; text-align: center;">
                    This is a test email sent from the admin dashboard to confirm that your SMTP server is working
                    properly.
                </p>

                <!-- Status Box -->
                <div
                    style="margin-top: 30px; background: #f8fbff; border-left: 4px solid #38ef7d; padding: 15px 20px; border-radius: 8px;">
                    <p style="margin: 0; color: #444444; font-size: 14px;">
                        <strong>Status:</strong> Email delivery system is active and operational.
                    </p>
                </div>

            </div>

            <!-- Footer -->
            <div style="background: #f4f7fb; padding: 20px; text-align: center; border-top: 1px solid #eaeaea;">
                <p style="margin: 0; color: #888888; font-size: 13px;">
                    © ${new Date().getFullYear()} ${orgName}. All rights reserved.
                </p>
                <p style="margin-top: 6px; color: #aaaaaa; font-size: 12px;">
                    This is an automated system-generated email.
                </p>
            </div>

        </div>

    </div>
            `,
    });

    return { success: true };
  } catch (error: any) {
    logger.error("Test email send error:", error);
    return { success: false, error: `Failed to send email: ${error.message}` };
  }
}
