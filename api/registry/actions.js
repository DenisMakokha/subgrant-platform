// /registry/actions.js
// Actions registry for the SSOT system

const ACTIONS = [
  // Existing actions from the specification (examples)
  { key:"line.create", entity:"budget_line", description:"Create budget line" },
  { key:"line.update", entity:"budget_line", description:"Edit budget line" },
  { key:"line.submit", entity:"budget_line", description:"Submit budget lines" },
  { key:"recon.upload", entity:"reconciliation", description:"Upload evidence" },
  { key:"report.generate.financial", entity:"financial_report", description:"Export finance XLSX" },
  { key:"report.submit.narrative", entity:"narrative_report", description:"Submit narrative report" },
  { key:"contract.view", entity:"contract", description:"View contracts" },
  { key:"contract.sign", entity:"contract", description:"Sign contracts" },
  { key:"approval.act", entity:"approval", description:"Approve/Reject items" },
  { key:"wizard.admin", entity:"admin", description:"Use Role & Dashboard Wizard" },
  
  // Fund request actions
  { key:"fundRequest.create", entity:"fund_request", description:"Create fund request" },
  { key:"fundRequest.submit", entity:"fund_request", description:"Submit fund request for approval" },
  { key:"fundRequest.approve", entity:"fund_request", description:"Approve fund request" },
  { key:"fundRequest.reject", entity:"fund_request", description:"Reject fund request" },
  
  // Notification actions
  { key:"notification.markAsRead", entity:"notification", description:"Mark notification as read" },
  { key:"notification.markAllAsRead", entity:"notification", description:"Mark all notifications as read" }
];

module.exports = { ACTIONS };