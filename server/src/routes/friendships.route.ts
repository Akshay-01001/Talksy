import express from 'express'
import { verifyRefreshToken } from '../middleware/verifyTokens.ts';
import { acceptOrRejectFriendRequest, getFriendRequestsList, getFriendsList, sendFriendRequest } from '../controllers/friendship.controller.ts';
const router = express.Router();

router.post('/request', verifyRefreshToken, sendFriendRequest);
router.get('/list', verifyRefreshToken, getFriendsList);
router.get('/requests/:userId', verifyRefreshToken, getFriendRequestsList);
router.put('/status/request/',verifyRefreshToken, acceptOrRejectFriendRequest)

export default router;
