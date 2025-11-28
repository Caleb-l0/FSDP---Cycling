const formModel = require("../Models/formModel");
async function submitForm(req, res) {
  const { title, description, datetime } = req.body;
    res.status(200).json({ message: "Form submitted successfully" });
}

module.exports = { submitForm };