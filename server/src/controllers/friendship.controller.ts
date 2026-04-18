import type { Request, Response} from "express";
import { friendShipSchema } from "../lib/validateSchema.ts";
import { db } from "../db/index.ts";
import { friendShipTable } from "../db/schema.ts";
import { and, eq, or } from "drizzle-orm";

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
            eq(friendShipTable.addressee_id, value.addressee_id)
          ),
          and(
            eq(friendShipTable.requester_id, value.addressee_id),
            eq(friendShipTable.addressee_id, value.requester_id)
          )
        )
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
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
