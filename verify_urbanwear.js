import fetch from 'node-fetch';

async function runVerification() {
  console.log("=== TaskPilot AI UrbanWear Comprehensive Verification ===");
  const baseUrl = "http://localhost:3000";

  // 1. Health check & DB status
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log("1. /api/health:", JSON.stringify(healthData, null, 2));

  // 2. Run automated test suite (/api/tests/run)
  const testRes = await fetch(`${baseUrl}/api/tests/run`, { method: "POST" });
  const testData = await testRes.json();
  console.log("2. Test Suite Results:", JSON.stringify(testData, null, 2));

  // 3. UrbanWear E-Commerce Brief Analysis
  const urbanWearBrief = `Client Brief: UrbanWear (Independent Streetwear Brand)
Launch Target: 4 weeks.
Requirements:
- Product catalog with streetwear apparel (hoodies, tees, caps).
- Secure checkout & payment gateway.
- Inventory tracking & stock management.
- Mobile-responsive UI with dark mode support.
- Admin dashboard for order management and analytics.`;

  console.log("3. Sending UrbanWear brief to POST /api/analyze (waiting for Gemma 4 response) ...");
  const startTime = Date.now();
  const analyzeRes = await fetch(`${baseUrl}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: urbanWearBrief })
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Analyze HTTP Status: ${analyzeRes.status} (${duration}s)`);

  const analyzeData = await analyzeRes.json();
  if (analyzeRes.ok) {
    console.log("\n=== URBANWEAR ANALYSIS OUTPUT ===");
    console.log("Summary:", analyzeData.analysis?.summary);
    console.log("\nDeliverables:", analyzeData.analysis?.deliverables);
    console.log("\nTasks Created in PostgreSQL:", analyzeData.analysis?.tasks?.length);
    if (analyzeData.analysis?.tasks) {
      analyzeData.analysis.tasks.forEach((t, i) => {
        console.log(`  [${i+1}] ${t.title} (Priority: ${t.priority}, Duration: ${t.durationDays}d, Status: ${t.status}, Assigned: ${t.assignedTo})`);
      });
    }
    console.log("\nDetected Risks:", JSON.stringify(analyzeData.analysis?.risks, null, 2));
    console.log("\nMissing Information / Questions:", JSON.stringify(analyzeData.analysis?.missingDetails, null, 2));
    console.log("\nClient Reply Draft:\n", analyzeData.analysis?.clientReplyDraft);
  } else {
    console.error("Analyze Error:", analyzeData);
  }

  // 4. Persistence check
  const tasksRes = await fetch(`${baseUrl}/api/tasks`);
  const tasks = await tasksRes.json();
  console.log(`\n4. PostgreSQL Persistence Check: Found ${tasks.length} tasks stored in database.`);

  const auditRes = await fetch(`${baseUrl}/api/audit-log`);
  const auditLogs = await auditRes.json();
  console.log(`5. Audit Logging Check: Found ${auditLogs.length} audit log entries stored.`);

  console.log("=== Verification Complete ===");
}

runVerification().catch(err => {
  console.error("Verification error:", err);
});
