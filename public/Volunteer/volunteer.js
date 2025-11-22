
// Function to handle volunteer form submission
function handleVolunteerFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    // Process form data (e.g., send to server or display a message)
    console.log("Volunteer Form Submitted:", Object.fromEntries(formData.entries()));
    alert("Thank you for signing up as a volunteer!");
}
// Attach event listener to the volunteer form
document.addEventListener("DOMContentLoaded", function() {
    const volunteerForm = document.getElementById("volunteer-form");
    if (volunteerForm) {
        volunteerForm.addEventListener("submit", handleVolunteerFormSubmit);
    }
});
// Additional volunteer-related functions can be added here
// For example, functions to fetch volunteer opportunities, update volunteer profiles, etc.
// Function to fetch volunteer opportunities (example)
function fetchVolunteerOpportunities() {
    // Simulate fetching data from a server
    const opportunities = [
        { title: "Community Clean-Up", date: "2024-07-15" },
        { title: "Food Drive Assistance", date: "2024-08-01" },
    ];
    console.log("Volunteer Opportunities:", opportunities);
    return opportunities;
}
// Call the function to fetch opportunities on page load
document.addEventListener("DOMContentLoaded", function() {
    fetchVolunteerOpportunities();
});

//Model//

const sql = require("mssql");
const db = require("../../dbconfig");

async function findForm(email) {
  await sql.connect(db);
  const result = await sql.query`SELECT * FROM forms WHERE id = ${id}`;
  return result.recordset[0];
}

async function getFormById(id) {
  await sql.connect(db);
  const result = await sql.query`
    SELECT id, title, dedscription, datetime FROM forms WHERE id = ${id}
  `;
  return result.recordset[0];
}

async function updateForm(id, name, email) {
  let updates = [];
    if (name) updates.push(`title='${title}'`);
    if (email) updates.push(`description='${description}'`);
    if (datetime) updates.push(`datetime='${datetime}'`);
    if (updates.length === 0) return;
    const query = `UPDATE forms SET ${updates.join(", ")} WHERE id=${id}`;
    await sql.query(query);
}

async function deleteForm(id) {
  await sql.connect(db);
  await sql.query`DELETE FROM forms WHERE id = ${id}`;
}

module.exports = { findForm, getFormById, updateForm, deleteForm };

//Controller//
const formModel = require("../Models/formModel");
async function submitForm(req, res) {
  const { title, description, datetime } = req.body;
    res.status(200).json({ message: "Form submitted successfully" });
}

module.exports = { submitForm };

//Validation//
const Joi = require("joi");

const formSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    datetime: Joi.date().required(),
});