exports.resetPasswordTemplate = (otp) => ({
  subject: "Reset Your Password",
  html: `
    <h2>Password Reset Request</h2>
    <p>Your OTP for resetting password is:</p>
    <h1>${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
  `,
});

exports.emailVerificationTemplate = (otp) => ({
  subject: "Verify Your Email",
  html: `
    <h2>Email Verification</h2>
    <p>Your verification code is:</p>
    <h1>${otp}</h1>
    <p>Please verify your email to continue.</p>
  `,
});

exports.interviewScheduledTemplate = (name, date, time) => ({
  subject: "Interview Scheduled",
  html: `
    <h2>Interview Invitation</h2>
    <p>Hello ${name},</p>
    <p>Your interview has been scheduled.</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Time:</strong> ${time}</p>
    <p>Please be available on time.</p>
  `,
});
exports.workerApprovedTemplate = (name) => ({
  subject: "Congratulations! You are approved 🎉",
  html: `
    <h2>Welcome to the Platform</h2>
    <p>Hello ${name},</p>
    <p>Congratulations! 🎉</p>
    <p>You have successfully passed the interview and are now approved as a worker.</p>
    <p>You can now start accepting tasks and earning.</p>
    <br/>
    <p>Best wishes,<br/>TaskNest-MicroTask Platform</p>
  `,
});
exports.workerRejectedTemplate = (name, reason) => ({
  subject: "Application Update",
  html: `
    <h2>Application Status</h2>
    <p>Hello ${name},</p>
    <p>We regret to inform you that your application was not approved.</p>
    <p><strong>Reason:</strong> ${reason || "Not specified"}</p>
    <p>You may reapply in the future.</p>
    <br/>
    <p>Regards,<br/>MicroTask Platform</p>
  `,
});
exports.workerBlockedTemplate = (name, reason, days) => ({
  subject: "Account Blocked",
  html: `
    <h2>Account Blocked</h2>
    <p>Hello ${name},</p>
    <p>Your account has been blocked.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    ${
      days
        ? `<p>Blocked for ${days} days.</p>`
        : `<p>This is a permanent block.</p>`
    }
    <br/>
    <p>If you believe this is a mistake, contact support.</p>
  `,
});
exports.workerUnblockedTemplate = (name) => ({
  subject: "Account Unblocked",
  html: `
    <h2>Account Restored</h2>
    <p>Hello ${name},</p>
    <p>Your account has been unblocked.</p>
    <p>You can now log in and continue working.</p>
    <br/>
    <p>Best regards,<br/>MicroTask Platform</p>
  `,
});
exports.workerRemovedTemplate = (name, reason) => ({
  subject: "Account Removed",
  html: `
    <h2>Account Removed</h2>
    <p>Hello ${name},</p>
    <p>Your account has been permanently removed from the platform.</p>
    <p><strong>Reason:</strong> ${reason || "Not specified"}</p>
    <br/>
    <p>If you have questions, please contact support.</p>
  `,
});
exports.providerBlockedTemplate = (name, reason, days) => ({
  subject: "Account Blocked",
  html: `
    <h2>Account Blocked</h2>
    <p>Hello ${name},</p>
    <p>Your provider account has been blocked.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    ${
      days
        ? `<p>Blocked for ${days} days.</p>`
        : `<p>This is a permanent block.</p>`
    }
    <br/>
    <p>Please contact support if needed.</p>
  `,
});

exports.providerUnblockedTemplate = (name) => ({
  subject: "Account Unblocked",
  html: `
    <h2>Account Restored</h2>
    <p>Hello ${name},</p>
    <p>Your provider account has been unblocked.</p>
    <p>You can now continue posting tasks.</p>
  `,
});

exports.providerRemovedTemplate = (name, reason) => ({
  subject: "Account Removed",
  html: `
    <h2>Account Removed</h2>
    <p>Hello ${name},</p>
    <p>Your provider account has been removed.</p>
    <p><strong>Reason:</strong> ${reason || "Not specified"}</p>
  `,
});
exports.connectionRequestTemplate = (workerName, providerName) => ({
  subject: "New Job Invitation",
  html: `
    <h2>Hello ${workerName}</h2>
    <p>${providerName} has invited you to work on a task.</p>
    <p>Please login to view details and accept/reject.</p>
  `,
});

exports.connectionAcceptedTemplate = (providerName, taskTitle) => ({
  subject: "Worker Accepted Your Task",
  html: `
    <h2>Hello ${providerName}</h2>
    <p>A worker has accepted your task:</p>
    <h3>${taskTitle}</h3>
    <p>You can now proceed with payment.</p>
  `,
});
/* =========================
   TASK CANCELLATION
========================= */

// Worker cancelled
exports.workerCancelledTaskTemplate = (providerName, taskTitle) => ({
  subject: "Task Cancelled by Worker",
  html: `
    <h2>Task Cancelled</h2>
    <p>Hello ${providerName},</p>
    <p>The worker has cancelled your task:</p>
    <h3>${taskTitle}</h3>
    <p>💰 Full refund has been issued to your wallet.</p>
  `,
});

// Provider cancelled
exports.providerCancelledTaskTemplate = (workerName, taskTitle) => ({
  subject: "Task Cancelled by Provider",
  html: `
    <h2>Task Cancelled</h2>
    <p>Hello ${workerName},</p>
    <p>The provider has cancelled the task:</p>
    <h3>${taskTitle}</h3>
    <p>💰 Compensation has been credited to your wallet.</p>
  `,
});

// Admin cancelled
exports.adminCancelledTaskTemplate = (name, taskTitle) => ({
  subject: "Task Cancelled by Admin",
  html: `
    <h2>Task Cancelled</h2>
    <p>Hello ${name},</p>
    <p>The admin has cancelled the task:</p>
    <h3>${taskTitle}</h3>
    <p>Please check your wallet for refund details.</p>
  `,
});

/* =========================
   DISPUTE RESOLUTION
========================= */

// Admin approved worker
exports.disputeResolvedWorkerTemplate = (workerName, taskTitle) => ({
  subject: "Dispute Resolved - Payment Released",
  html: `
    <h2>Dispute Resolved</h2>
    <p>Hello ${workerName},</p>
    <p>Your work for the task has been approved by admin:</p>
    <h3>${taskTitle}</h3>
    <p>💰 Payment has been released.</p>
  `,
});

// Admin refunded provider
exports.disputeResolvedProviderTemplate = (providerName, taskTitle) => ({
  subject: "Dispute Resolved - Refund Issued",
  html: `
    <h2>Dispute Resved</h2>
    <p>Hello ${providerName},</p>
    <p>The admin has resolved the dispute for:</p>
    <h3>${taskTitle}</h3>
    <p>💰 Refund has been credited to your wallet.</p>
  `,
});