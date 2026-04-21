import type { Request, Response } from "express";
import {
  friendShipSchema,
  sendFriendRequestSchema,
} from "../lib/validateSchema.ts";
import { db } from "../db/index.ts";
import { friendShipTable, usersTable } from "../db/schema.ts";
import { and, eq, inArray, or } from "drizzle-orm";
import type { AuthRequest } from "../types/index.js";

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const { error, value } = friendShipSchema.validate(data, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0]?.message ?? "Validation error",
      });
    }

    const existingReq = await db
      .select()
      .from(friendShipTable)
      .where(
        or(
          and(
            eq(friendShipTable.requester_id, value.requester_id),
            eq(friendShipTable.addressee_id, value.addressee_id),
          ),
          and(
            eq(friendShipTable.requester_id, value.addressee_id),
            eq(friendShipTable.addressee_id, value.requester_id),
          ),
        ),
      )
      .limit(1);

    if (existingReq.length > 0) {
      return res.status(400).json({
        message: "Friend request already exists",
      });
    }

    await db.insert(friendShipTable).values(value);

    return res.status(201).json({
      message: "Request sent successfully",
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const acceptOrRejectFriendRequest = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req?.user?.id;

    const { error, value } = sendFriendRequestSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0]?.message ?? "Validation error",
      });
    }

    const { request_id, status } = value; // action = "accepted" | "rejected"

    // Step 1: Get request
    const existingReq = await db
      .select()
      .from(friendShipTable)
      .where(eq(friendShipTable.id, request_id))
      .limit(1);

    if (existingReq.length === 0) {
      return res.status(404).json({
        message: "Friend request not found",
      });
    }

    const request = existingReq[0];

    // Step 2: Authorization check
    if (request?.addressee_id !== userId) {
      return res.status(403).json({
        message: "You are not allowed to perform this action",
      });
    }

    // Optional: prevent re-processing
    if (request?.status !== "pending") {
      return res.status(400).json({
        message: "Request already processed",
      });
    }

    // step 3: Update using request_id (NOT user input IDs)
    const result = await db
      .update(friendShipTable)
      .set({ status })
      .where(eq(friendShipTable.id, request_id))
      .returning();

    return res.status(200).json({
      message: `Friend request ${status}`,
      data: result[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getFriendsList = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const friendships = await db
      .select()
      .from(friendShipTable)
      .where(
        and(
          or(
            eq(friendShipTable.requester_id, userId),
            eq(friendShipTable.addressee_id, userId),
          ),
          eq(friendShipTable.status, "accepted"),
        ),
      );

    const friendIds = friendships.map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id,
    );

    const friends = await db
      .select({
        username: usersTable.username,
        avatar_url: usersTable.avatar_url,
        bio: usersTable.bio
      })
      .from(usersTable)
      .where(inArray(usersTable.id, friendIds));

    return res.status(200).json({
      message: "Friend List Fetched Successfully",
      data: friends,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getFriendRequestsList = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const requests = await db
      .select()
      .from(friendShipTable)
      .where(
        and(
          or(eq(friendShipTable.addressee_id, userId)),
          eq(friendShipTable.status, "pending"),
        ),
      );

    const senderIds = requests.map((f) => f.requester_id);

    const requestList = await db
      .select({
        username: usersTable.username,
        avatar_url: usersTable.avatar_url,
        bio: usersTable.bio
      })
      .from(usersTable)
      .where(inArray(usersTable.id, senderIds));

    return res.status(200).json({
      message: "Friend Requests List Fetched Successfully",
      data: requestList,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
