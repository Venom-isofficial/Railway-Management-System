const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 */
async function sendEmail({ to, subject, text, html }) {
  try {
    // Check if email is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn("Email service not configured. Skipping email send.");
      return { success: false, message: "Email service not configured" };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send low stock alert email
 */
async function sendLowStockAlert(item, recipients) {
  const subject = `Low Stock Alert: ${item.name}`;
  const text = `Item ${item.name} (Code: ${item.item_code}) is running low.\n\nCurrent Quantity: ${item.quantity_available}\nMinimum Threshold: ${item.min_threshold}\nDepartment: ${item.department_name}\n\nPlease reorder soon.`;
  const html = `
    <h2>Low Stock Alert</h2>
    <p>Item <strong>${item.name}</strong> (Code: ${
    item.item_code
  }) is running low.</p>
    <ul>
      <li><strong>Current Quantity:</strong> ${item.quantity_available}</li>
      <li><strong>Minimum Threshold:</strong> ${item.min_threshold}</li>
      <li><strong>Department:</strong> ${item.department_name || "N/A"}</li>
    </ul>
    <p>Please reorder soon to avoid stockout.</p>
  `;

  for (const recipient of recipients) {
    await sendEmail({ to: recipient, subject, text, html });
  }
}

/**
 * Send issue notification email
 */
async function sendIssueNotification(issue, recipient) {
  const subject = `Item Issued: ${issue.item_name}`;
  const text = `An item has been issued to ${issue.recipient_name}.\n\nItem: ${
    issue.item_name
  }\nQuantity: ${issue.quantity}\nIssued By: ${
    issue.issued_by_name
  }\nExpected Return: ${issue.expected_return_date || "N/A"}`;
  const html = `
    <h2>Item Issued</h2>
    <p>An item has been issued to <strong>${issue.recipient_name}</strong>.</p>
    <ul>
      <li><strong>Item:</strong> ${issue.item_name}</li>
      <li><strong>Quantity:</strong> ${issue.quantity}</li>
      <li><strong>Issued By:</strong> ${issue.issued_by_name}</li>
      <li><strong>Issue Date:</strong> ${new Date(
        issue.issue_date
      ).toLocaleDateString()}</li>
      <li><strong>Expected Return:</strong> ${
        issue.expected_return_date
          ? new Date(issue.expected_return_date).toLocaleDateString()
          : "N/A"
      }</li>
    </ul>
  `;

  await sendEmail({ to: recipient, subject, text, html });
}

module.exports = {
  sendEmail,
  sendLowStockAlert,
  sendIssueNotification,
};
