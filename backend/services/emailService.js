
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"CanAccount Automation" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const templates = {
  overdueFiling: (clientName, filingType, dueDate) => `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #e11d48;">CRA Compliance Notice</h2>
      <p>Dear ${clientName},</p>
      <p>This is an automated reminder from your accounting team regarding an <strong>overdue filing</strong>.</p>
      <div style="background: #fff1f2; padding: 15px; border-radius: 8px; border-left: 4px solid #e11d48;">
        <strong>Task:</strong> ${filingType}<br/>
        <strong>Original Due Date:</strong> ${dueDate}
      </div>
      <p>Please provide the necessary documents or confirmation as soon as possible to avoid CRA late-filing penalties.</p>
      <p>Best regards,<br/><strong>CanAccount Team</strong></p>
    </div>
  `,
  missingStatement: (clientName, bankName, period) => `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #4f46e5;">Document Request: Bank Statements</h2>
      <p>Dear ${clientName},</p>
      <p>We are currently missing documents required to reconcile your accounts for <strong>${period}</strong>.</p>
      <div style="background: #eef2ff; padding: 15px; border-radius: 8px; border-left: 4px solid #4f46e5;">
        <strong>Required:</strong> ${bankName} Statement
      </div>
      <p>You can upload this document directly via our portal or reply to this email with the PDF attached.</p>
      <p>Best regards,<br/><strong>CanAccount Team</strong></p>
    </div>
  `
};
