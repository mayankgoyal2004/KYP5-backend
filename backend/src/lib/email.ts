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
      logger.debug("Email disabled via settings, skipping send");
      return false;
    }

    const transport = await createTransport();
    if (!transport) {
      logger.warn("SMTP not configured, skipping email");
      return false;
    }

    const emailFrom = await getSetting("email_from");
    const smtpUser = await getSetting("smtp_user");
    const from = emailFrom || smtpUser;

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

    const orgName = await getSetting("org_name") || "Online Exam Platform";

    await transport.sendMail({
      from,
      to,
      subject: `${orgName}: SMTP Test`,
      html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>✅ SMTP Configuration Successful</h2>
                    <p>Your ${orgName} email settings are correctly configured!</p>
                    <p>This is a test email triggered from the admin dashboard.</p>
                </div>
            `,
    });

    return { success: true };
  } catch (error: any) {
    logger.error("Test email send error:", error);
    return { success: false, error: `Failed to send email: ${error.message}` };
  }
}
