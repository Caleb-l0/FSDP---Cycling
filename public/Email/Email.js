
async function getOrganisationID() {
  try {
    const response = await fetch("http://localhost:3000/getOrganID", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log("Organization ID:", result.OrganizationID);
    return result.OrganizationID;

  } catch (err) {
    console.error("Error fetching organization ID:", err);
  }
}

async function getUserEmail(orgID) {
  try {
    const response = await fetch(`http://localhost:3000/getUserEmail/${orgID}`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log("Emails:", result);
    return result;

  } catch (err) {
    console.error("Error fetching emails:", err);
  }
}


async function notifyUser(email, name, eventName) {
  try {
    const response = await fetch("http://localhost:3000/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `Event Update: ${eventName}`,
        message: `Hello ${name}, your event ${eventName} has been approved.`
      })
    });

    const result = await response.json();
    console.log(result);
  } catch (err) {
    console.error("Email send error:", err);
  }
}



