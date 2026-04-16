const API = "http://127.0.0.1:5000";

async function findPartners() {
  const res = await fetch(API + "/find-partner", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      subject: document.getElementById("subject").value,
      time: document.getElementById("time").value
    })
  });

  const data = await res.json();
  console.log(data);
}