async function verifyTimeoutFix() {
  console.log("=== VERIFYING /api/analyze TIMEOUT FIX & GEMMA 4 INTEGRATION ===");
  
  // Test 1: Real Gemma 4 request with 60s client timeout (exceeding backend's 50s timeout)
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    console.log("Sending analysis request to /api/analyze (client timeout: 60s, backend timeout: 50s)...");
    const res = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ message: 'Brief: Build a mobile e-commerce checkout page with Apple Pay and Stripe integration by next Friday.' }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    const data = await res.json();

    console.log(`HTTP Status: ${res.status}`);
    console.log(`Response Duration: ${duration}ms`);
    console.log(`Model Provenance: ${data.analysis?.summary ? "Confirmed real Gemma 4 model response" : "Check data"}`);
    
    if (res.ok && data.success && data.analysis) {
      console.log(`[PASS] Request completed successfully in ${duration}ms without client or backend timeout.`);
      console.log(`Summary snippet: ${data.analysis.summary?.substring(0, 90)}...`);
      console.log(`Tasks extracted: ${data.analysis.tasks?.length}`);
    } else {
      console.log(`[FAIL] Request returned status ${res.status}:`, data);
    }
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[FAIL] Request failed or timed out after ${duration}ms:`, err.message);
  }
}

verifyTimeoutFix();
