import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(20)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(8)
    .max(32)
    .pattern(/^[a-zA-Z0-9@#$%^&*!]+$/)
    .required(),

  avatar_url: Joi.string()
    .uri()
    .allow(null, ""),

  bio: Joi.string()
    .max(200)
    .allow(null, "")
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(8)
    .max(32)
    .pattern(/^[a-zA-Z0-9@#$%^&*!]+$/)
    .required()
});