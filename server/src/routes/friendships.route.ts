import express from 'express'
import { verifyRefreshToken } from '../middleware/verifyTokens.ts';
import { acceptOrRejectFriendRequest, getFriendRequestsList, getFriendsList, sendFriendRequest } from '../controllers/friendship.controller.ts';
const router = express.Router();

router.post('/request', verifyRefreshToken, sendFriendRequest);
router.post('/list', verifyRefreshToken, getFriendsList);
router.get('/requests/:userId', verifyRefreshToken, getFriendRequestsList);
router.put('/status/request/:requestId',verifyRefreshToken, acceptOrRejectFriendRequest)

export default router;
