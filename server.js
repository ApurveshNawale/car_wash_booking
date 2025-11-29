document.getElementById("bookBtn").addEventListener("click", async () => {

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const location = document.getElementById("location").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const service = document.getElementById("service").value;

  if (!name || !phone || !location || !date || !time) {
    showToast("Please fill all fields");
    return;
  }

  const backendURL = https://script.google.com/macros/s/AKfycbzhLKJg6MhYHoEfxEt5Y6IwSBN2b7EcPxqDLGppinBUxq8Ix2OH21WyRZGTuvu338A7/exec;

  const formData = {
    name, phone, location, date, time, service
  };

  try {
    const res = await fetch(backendURL, {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    if (data.success) {
      showToast("Booking saved!");

      // redirect to WhatsApp
      const message =
        `New Booking%0A` +
        `Name: ${name}%0A` +
        `Phone: ${phone}%0A` +
        `Location: ${location}%0A` +
        `Date: ${date}%0A` +
        `Time: ${time}%0A` +
        `Service: ${service}`;

      window.location.href =
        `https://wa.me/917448160689?text=${message}`;
    } else {
      showToast("Failed! Try again later.");
    }

  } catch (err) {
    showToast("Connection error!");
  }
});
