import express, { type Request, type Response } from 'express'
import { configDotenv } from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

const server = express();
const httpServer = createServer(server);
configDotenv();

const PORT = process.env.PORT;

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    connectionStateRecovery: {}
});

io.on("connection", (socket) => {
    console.log("a user connected : " + socket.id);
    socket.on("disconnect", () => {
        console.log("user disconnected : " + socket.id);
    });
});

server.get("/", (req: Request, res: Response) => {
    return res.status(200).json({
        message: "Server Running"
    });
});

httpServer.listen(PORT,()=> {
    console.log(`server : http://localhost:${PORT}`);
})