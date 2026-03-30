import nodemailer from "nodemailer";
import { getSetting, getSettingBoolean } from "./settings.js";
import logger from "../../../backend testing/src/utils/logger.js";

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

    await transport.sendMail({
      from,
      to,
      subject: "Constituency Management Portal: SMTP Test",
      html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>✅ SMTP Configuration Successful</h2>
                    <p>Your Constituency Management Portal email settings are correctly configured!</p>
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

/**
 * Build a nice HTML email body for data activity notifications.
 */
export function buildActivityEmailHtml({
  action,
  module,
  userName,
  recordCount,
  timestamp,
}: {
  action: "EXPORT" | "IMPORT";
  module: string;
  userName: string;
  recordCount: number;
  timestamp: Date;
}): string {
  const actionLabel = action === "EXPORT" ? "exported" : "imported";
  const actionColor = action === "EXPORT" ? "#3b82f6" : "#22c55e";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, ${actionColor}15, ${actionColor}05); border: 1px solid ${actionColor}30; border-radius: 12px; padding: 24px;">
        <h2 style="margin: 0 0 8px; color: ${actionColor}; font-size: 18px;">
          📊 Data ${action === "EXPORT" ? "Export" : "Import"} Notification
        </h2>
        <p style="margin: 0 0 16px; color: #64748b; font-size: 14px;">
          A user has ${actionLabel} data from your portal.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 13px; width: 120px;">User</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Module</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px; text-transform: capitalize;">${module}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Action</td>
            <td style="padding: 8px 0; font-size: 14px;">
              <span style="background: ${actionColor}20; color: ${actionColor}; padding: 2px 10px; border-radius: 20px; font-weight: 600; font-size: 12px;">
                ${action}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Records</td>
            <td style="padding: 8px 0; font-weight: 600; font-size: 14px;">${recordCount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 13px;">Time</td>
            <td style="padding: 8px 0; font-size: 14px;">${timestamp.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 16px;">
        Constituency Management Portal — Automated Notification
      </p>
    </div>
  `;
}

/**
 * Build a nice HTML email body for meeting notifications.
 */
export function buildMeetingEmailHtml({
  meeting,
  action,
}: {
  meeting: any;
  action: "CREATED" | "UPDATED" | "CANCELLED" | "REMINDER";
}): string {
  const actionColor =
    action === "CANCELLED"
      ? "#ef4444"
      : action === "REMINDER"
        ? "#f59e0b"
        : "#6366f1";
  const actionLabel =
    action === "REMINDER" ? "Pending/Upcoming" : action.toLowerCase();
  const dateStr = new Date(meeting.date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; padding: 8px 16px; border-radius: 20px; background: ${actionColor}15; color: ${actionColor}; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
          Meeting ${actionLabel}
        </div>
        <h1 style="margin: 16px 0 8px; color: #1e293b; font-size: 24px; font-weight: 800;">
          ${meeting.title}
        </h1>
        <p style="margin: 0; color: #64748b; font-size: 16px;">
          ${dateStr} ${meeting.time ? `at ${meeting.time}` : ""}
        </p>
      </div>

      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Meeting Details</h3>
        
        <div style="display: flex; margin-bottom: 12px;">
          <div style="width: 24px; margin-right: 12px; font-size: 18px;">📍</div>
          <div>
            <div style="font-weight: 600; color: #1e293b;">${meeting.type === "ONLINE" ? "Online Meeting" : "In-Person"}</div>
            <div style="color: #64748b; font-size: 14px;">${meeting.location || (meeting.type === "ONLINE" ? "Virtual Link" : "No location specified")}</div>
          </div>
        </div>

        ${
          meeting.description
            ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">Agenda</div>
          <div style="color: #475569; font-size: 14px; line-height: 1.5;">${meeting.description}</div>
        </div>
        `
            : ""
        }
      </div>

      ${
        meeting.meetingLink && action !== "CANCELLED"
          ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${meeting.meetingLink}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);">
          Join Meeting
        </a>
      </div>
      `
          : ""
      }

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 13px; text-align: center;">
        <p style="margin: 0 0 4px;">Organized by: <strong>${meeting.organizedBy || "Admin"}</strong></p>
        <p style="margin: 0;">This is an automated notification from your Constituency Management Portal.</p>
      </div>
    </div>
  `;
}
