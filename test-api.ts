const fs = require('fs');
async function testAPI() {
    const formData = new FormData();
    const dummyPdf = Buffer.from("%PDF-1.4\n%EOF", "utf8");
    const blob = new Blob([dummyPdf], { type: 'application/pdf' });
    formData.append("file", blob, "dummy.pdf");
    formData.append("query", "What is this?");

    try {
        const res = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            body: formData
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response text length:", text.length, "Preview:", text.substring(0, 1000));
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}
testAPI();
