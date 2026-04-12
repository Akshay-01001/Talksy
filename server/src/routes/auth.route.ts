import express from 'express'
import { register, login, generateNewAccessToken, logout } from '../controllers/auth.controller.ts';
import { verifyRefreshToken } from '../middleware/verifyTokens.ts';
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", verifyRefreshToken, generateNewAccessToken);
router.post('/logout', verifyRefreshToken, logout);

export default router;