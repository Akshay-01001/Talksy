import express from 'express'
import { verifyRefreshToken } from '../middleware/verifyTokens.ts';
import { acceptOrRejectFriendRequest, getFriendRequestsList, getFriendsList, sendFriendRequest } from '../controllers/friendship.controller.ts';
const router = express.Router();

router.post('/friends/request', verifyRefreshToken, sendFriendRequest);
router.post('/friends/list', verifyRefreshToken, getFriendsList);
router.post('/friends/requests', verifyRefreshToken, getFriendRequestsList);
router.put('/status/request/:requestId',verifyRefreshToken, acceptOrRejectFriendRequest)