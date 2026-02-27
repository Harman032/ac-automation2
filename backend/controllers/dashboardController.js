
import pool from '../db.js';
import { sendEmail, templates } from '../services/emailService.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [overdueF] = await pool.query("SELECT COUNT(*) as count FROM compliance_filings WHERE due_date < CURDATE() AND status != 'Filed'");
    const [pendingF] = await pool.query("SELECT COUNT(*) as count FROM compliance_filings WHERE status = 'Pending'");
    const [missingS] = await pool.query("SELECT COUNT(*) as count FROM statements WHERE expected_date < CURDATE() AND received_status = 'Pending'");
    const [clientCount] = await pool.query("SELECT COUNT(*) as count FROM clients");
    
    // Workload now based on the specialized accountants table
    const [workload] = await pool.query(`
      SELECT 
        a.name, 
        a.id as accountantId, 
        a.max_capacity as maxCapacity,
        COUNT(c.id) as count 
      FROM accountants a
      LEFT JOIN clients c ON a.id = c.assigned_accountant_id 
      GROUP BY a.id
    `);

    res.json({
      overdueFilings: overdueF[0].count,
      pendingFilings: pendingF[0].count,
      missingStatements: missingS[0].count,
      activeClients: clientCount[0].count,
      workloadData: workload
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const alerts = [];
    const [overdue] = await pool.query(`
      SELECT f.id, f.compliance_type, f.due_date, c.company_name 
      FROM compliance_filings f JOIN clients c ON f.client_id = c.id 
      WHERE f.due_date < CURDATE() AND f.status != 'Filed'
    `);
    
    overdue.forEach(f => {
      alerts.push({
        id: `f-${f.id}`,
        type: 'overdue',
        message: `OVERDUE: ${f.compliance_type} for ${f.company_name}`,
        severity: 'high',
        link: '/compliance',
        timestamp: f.due_date
      });
    });

    const [missing] = await pool.query(`
      SELECT s.id, s.bank_name, s.expected_date, c.company_name 
      FROM statements s JOIN clients c ON s.client_id = c.id 
      WHERE s.expected_date < CURDATE() AND s.received_status = 'Pending'
    `);

    missing.forEach(s => {
      alerts.push({
        id: `s-${s.id}`,
        type: 'missing_doc',
        message: `MISSING: ${s.bank_name} for ${s.company_name}`,
        severity: 'high',
        link: '/statements',
        timestamp: s.expected_date
      });
    });

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const sendBatchReminders = async (req, res) => {
  const { type } = req.params; 
  let sentCount = 0;

  try {
    if (type === 'compliance') {
      const [overdue] = await pool.query(`
        SELECT f.id, f.compliance_type, f.due_date, c.company_name, c.email 
        FROM compliance_filings f 
        JOIN clients c ON f.client_id = c.id 
        WHERE f.due_date < CURDATE() 
        AND f.status != 'Filed' 
        AND (f.reminder_sent_at IS NULL OR f.reminder_sent_at < CURDATE())
      `);

      for (const item of overdue) {
        if (item.email) {
          const success = await sendEmail(
            item.email,
            `URGENT: Overdue ${item.compliance_type} Filing - ${item.company_name}`,
            templates.overdueFiling(item.company_name, item.compliance_type, item.due_date)
          );
          if (success) {
            await pool.query('UPDATE compliance_filings SET reminder_sent_at = CURDATE() WHERE id = ?', [item.id]);
            sentCount++;
          }
        }
      }
    } else if (type === 'statements') {
      const [missing] = await pool.query(`
        SELECT s.id, s.bank_name, s.period_year, s.period_month, c.company_name, c.email 
        FROM statements s 
        JOIN clients c ON s.client_id = c.id 
        WHERE s.expected_date < CURDATE() 
        AND s.received_status = 'Pending'
        AND (s.reminder_sent_at IS NULL OR s.reminder_sent_at < CURDATE())
      `);

      for (const item of missing) {
        if (item.email) {
          const period = `${new Date(2000, item.period_month - 1).toLocaleString('default', { month: 'long' })} ${item.period_year}`;
          const success = await sendEmail(
            item.email,
            `Action Required: Missing Statement for ${item.company_name}`,
            templates.missingStatement(item.company_name, item.bank_name, period)
          );
          if (success) {
            await pool.query('UPDATE statements SET reminder_sent_at = CURDATE() WHERE id = ?', [item.id]);
            sentCount++;
          }
        }
      }
    }

    res.json({ count: sentCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing remediation.' });
  }
};
