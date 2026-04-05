import express from 'express'
import { register, login, generateNewAccessToken } from '../controllers/auth.controller.ts';
import { verifyRefreshToken } from '../middleware/verifyTokens.ts';
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", verifyRefreshToken, generateNewAccessToken);

export default router;