import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

interface SocketUser {
  userId: string;
  role: string;
  email: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

class SocketService {
  private io: Server | null = null;

  public init(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.WEB_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: "/socket.io",
    });

    // JWT Authentication middleware for sockets
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
          this.parseCookieToken(socket.handshake.headers.cookie);

        if (!token) {
          // Allow unauthenticated connection or reject if strict
          return next();
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
          if (process.env.NODE_ENV === "production") {
            throw new Error(
              "Missing required environment variable: JWT_SECRET",
            );
          }
          console.warn("[socket] Warning: JWT_SECRET is not set.");
          return next(
            new Error("Authentication error: JWT_SECRET not configured"),
          );
        }
        const decoded = jwt.verify(token, secret) as SocketUser;
        socket.user = decoded;
        next();
      } catch (err) {
        console.warn(
          "[socket] Authentication failed for socket:",
          (err as Error).message,
        );
        next();
      }
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.user?.userId;
      if (userId) {
        // Join personal user room
        socket.join(`user:${userId}`);
        console.log(`[socket] User connected: ${userId} (socket ${socket.id})`);
      } else {
        console.log(`[socket] Guest connected: socket ${socket.id}`);
      }

      // Handle custom event to join batch room
      socket.on("join:batch", (batchId: string) => {
        if (batchId) {
          socket.join(`batch:${batchId}`);
          console.log(
            `[socket] Socket ${socket.id} joined room batch:${batchId}`,
          );
        }
      });

      socket.on("disconnect", () => {
        if (userId) {
          console.log(`[socket] User disconnected: ${userId}`);
        }
      });
    });

    console.log("[socket] Socket.io Gateway initialized.");
  }

  private parseCookieToken(cookieHeader?: string): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").reduce(
      (acc, curr) => {
        const [key, val] = curr.trim().split("=");
        acc[key] = val;
        return acc;
      },
      {} as Record<string, string>,
    );
    return cookies["token"] || cookies["access_token"] || null;
  }

  public emitToUser(userId: string, event: string, data: unknown) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  public emitToUsers(userIds: string[], event: string, data: unknown) {
    if (this.io) {
      userIds.forEach((userId) => {
        this.io?.to(`user:${userId}`).emit(event, data);
      });
    }
  }

  public emitToBatch(batchId: string, event: string, data: unknown) {
    if (this.io) {
      this.io.to(`batch:${batchId}`).emit(event, data);
    }
  }

  public broadcast(event: string, data: unknown) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
