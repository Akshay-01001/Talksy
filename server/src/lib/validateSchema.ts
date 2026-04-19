import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(20)
    .required()
    .messages({
      "string.empty": "Username is required",
      "string.min": "Username must be at least 3 characters",
      "string.max": "Username must be at most 20 characters",
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email format",
    }),

  password: Joi.string()
    .min(8)
    .max(32)
    .pattern(/^[a-zA-Z0-9@#$%^&*!]+$/)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password must be at most 32 characters",
      "string.pattern.base":
        "Password can only contain letters, numbers and @#$%^&*!",
    }),

  avatar_url: Joi.string()
    .uri()
    .allow(null, "")
    .messages({
      "string.uri": "Avatar must be a valid URL",
    }),

  bio: Joi.string()
    .max(200)
    .allow(null, "")
    .messages({
      "string.max": "Bio must be at most 200 characters",
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required",
      "string.email": "Invalid email format",
    }),

  password: Joi.string()
    .min(8)
    .max(32)
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be at least 8 characters",
    }),
});

export const friendShipSchema = Joi.object({
  requester_id: Joi.string()
    .uuid()
    .required()
    .messages({
      "string.empty": "Requester ID is required"
    }),
  addressee_id: Joi.string()
    .uuid()
    .required()
    .messages({
      "string.empty": "Receiever ID is required"
    }),
  status: Joi.string()
    .valid("pending", "accepted", "rejected")
    .default("pending")
    .messages({
      "any.only": "Status must be one of pending, accepted, rejected",
    }),
}).custom((value, helpers) => {
  if (value.requester_id === value.addressee_id) {
    return helpers.error("any.invalid");
  }
  return value;
}).messages({
  "any.invalid": "You cannot send a friend request to yourself",
});

export const sendFriendRequestSchema = Joi.object({
  request_id: Joi.string().
    uuid().
    required().
    messages({
      "string.empty": "Request ID is required"
    }),
  status: Joi.string()
    .valid("pending", "accepted", "rejected")
});
