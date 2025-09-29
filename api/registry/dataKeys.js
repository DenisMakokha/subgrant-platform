// /registry/dataKeys.js
// Data keys registry for the SSOT system

const DATA_KEYS = [
  { key:"budget.pb.summary", params:["partnerId","projectId"] },
  { key:"budget.lines", params:["partnerBudgetId"] },
  { key:"budget.lines.approved", params:["partnerBudgetId"] },
  { key:"recon.summary", params:["partnerBudgetId"] },
  { key:"contract.list", params:["partnerId","projectId","scope"] },
  { key:"contract.files", params:["contractId"] },
  { key:"report.schedule", params:["projectId","partnerId"] },
  { key:"report.history", params:["projectId","partnerId"] },
  { key:"approval.queue", params:["role","scope"] },
  { key:"admin.kpis", params:[] },
  
  // Fund request data keys
  { key:"fundRequest.list", params:["projectId","partnerId"] },
  { key:"fundRequest.detail", params:["fundRequestId"] },
  
  // Notification data keys
  { key:"notification.list", params:["userId"] },
  { key:"notification.detail", params:["notificationId"] }
];

module.exports = { DATA_KEYS };