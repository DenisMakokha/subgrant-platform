// /registry/capabilities.js
// Capability catalog for the SSOT system

const CAPABILITIES = [
  { cap:"line.create", area:"Budget", label:"Create budget line", dependsOn:[] },
  { cap:"line.update", area:"Budget", label:"Edit budget line", dependsOn:[] },
  { cap:"line.submit", area:"Budget", label:"Submit budget lines", dependsOn:["line.update"] },
  { cap:"recon.upload", area:"Reconciliation", label:"Upload evidence", dependsOn:[] },
  { cap:"report.generate.financial", area:"Reports", label:"Export finance XLSX", dependsOn:[] },
  { cap:"report.submit.narrative", area:"Reports", label:"Submit narrative report", dependsOn:[] },
  { cap:"contract.view", area:"Contracts", label:"View contracts", dependsOn:[] },
  { cap:"contract.sign", area:"Contracts", label:"Sign contracts", dependsOn:["contract.view"] },
  { cap:"approval.act", area:"Approvals", label:"Approve/Reject items", dependsOn:[] },
  { cap:"wizard.admin", area:"Admin", label:"Use Role & Dashboard Wizard", dependsOn:[] },
  
  // Fund request capabilities
  { cap:"fundRequest.create", area:"Fund Requests", label:"Create fund request", dependsOn:[] },
  { cap:"fundRequest.submit", area:"Fund Requests", label:"Submit fund request for approval", dependsOn:["fundRequest.create"] },
  { cap:"fundRequest.approve", area:"Fund Requests", label:"Approve fund request", dependsOn:["approval.act"] },
  { cap:"fundRequest.reject", area:"Fund Requests", label:"Reject fund request", dependsOn:["approval.act"] }
];

module.exports = { CAPABILITIES };