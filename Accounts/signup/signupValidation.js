const Joi = require("joi");

const signupSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(4).required(),
  role: Joi.string().valid("admin", "institution", "volunteer").required()
});

function validateSignup(req, res, next) {
  const { error } = signupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: error.details[0].message,
      error: error.details[0].message 
    });
  }
  next();
}

module.exports = { validateSignup };
