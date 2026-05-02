const { createServer } = require("http");
const path = require("path");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const next = require("next");
const { Server } = require("socket.io");
const { getToken, decode } = require("next-auth/jwt");
const Database = require("better-sqlite3");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const SOCKET_PATH = "/api/socket";

if (!process.env.NEXTAUTH_SECRET) {
  console.warn(
    "[server.js] WARNING: NEXTAUTH_SECRET is not set. Socket handshake auth will fail.",
  );
} else {
  console.log("[server.js] NEXTAUTH_SECRET loaded.");
}

const app = next({ dev, turbopack: true });
const handle = app.getRequestHandler();

const db = new Database(path.resolve("app/data/focusroom.db"));
const getRoomStmt = db.prepare(
  "SELECT id, host_id, name, max_members FROM rooms WHERE id = ?",
);

const DEFAULT_FOCUS_MIN = 25;
const CHAT_COOLDOWN_MS = 1500;

const rooms = new Map();

function getOrCreateRoom(roomId, hostId) {
  let r = rooms.get(roomId);
  if (!r) {
    const duration = DEFAULT_FOCUS_MIN * 60 * 1000;
    r = {
      hostId,
      members: new Map(),
      timer: {
        phase: "focus",
        durationMs: duration,
        remainingMs: duration,
        startedAt: null,
        running: false,
      },
      tickHandle: null,
    };
    rooms.set(roomId, r);
  }
  return r;
}

function snapshotTimer(t) {
  if (t.running && t.startedAt !== null) {
    const elapsed = Date.now() - t.startedAt;
    const rem = Math.max(0, t.remainingMs - elapsed);
    return {
      phase: t.phase,
      durationMs: t.durationMs,
      remainingMs: rem,
      running: rem > 0,
    };
  }
  return {
    phase: t.phase,
    durationMs: t.durationMs,
    remainingMs: t.remainingMs,
    running: false,
  };
}

function broadcastTimer(io, roomId, room) {
  io.to(`room:${roomId}`).emit("timer:tick", snapshotTimer(room.timer));
}

function stopTick(room) {
  if (room.tickHandle) {
    clearInterval(room.tickHandle);
    room.tickHandle = null;
  }
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    if (req.url && req.url.startsWith(SOCKET_PATH)) return;
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: SOCKET_PATH,
    serveClient: false,
  });

  io.use(async (socket, nextMw) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const pairs = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const idx = c.indexOf("=");
          return idx === -1 ? [c, ""] : [c.slice(0, idx), c.slice(idx + 1)];
        });
      const cookieMap = Object.fromEntries(pairs);
      const rawToken =
        cookieMap["__Secure-next-auth.session-token"] ||
        cookieMap["next-auth.session-token"] ||
        null;

      let token = null;
      if (rawToken) {
        try {
          token = await decode({
            token: rawToken,
            secret: process.env.NEXTAUTH_SECRET,
          });
        } catch (e) {
          console.warn(
            `[socket auth] decode threw: ${e && e.message}. tokenLen=${rawToken.length} secretLen=${(process.env.NEXTAUTH_SECRET || "").length}`,
          );
        }
      }

      if (!token || !token.id) {
        console.warn(
          `[socket auth] rejected. cookies=${JSON.stringify(Object.keys(cookieMap))} hasRawToken=${!!rawToken} token=${JSON.stringify(token)}`,
        );
        return nextMw(new Error("unauthenticated"));
      }
      socket.data.userId = Number(token.id);
      socket.data.userName = token.name || "Anonymous";
      socket.data.pic = token.profilePictureLink || null;
      nextMw();
    } catch (err) {
      console.error("[socket auth] error:", err);
      nextMw(new Error("auth-failed"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:join", (raw) => {
      const roomId = Number(raw && raw.roomId);
      if (!Number.isFinite(roomId)) {
        socket.emit("room:error", "invalid-room");
        return;
      }
      const row = getRoomStmt.get(roomId);
      if (!row) {
        socket.emit("room:error", "room-not-found");
        return;
      }

      for (const r of socket.rooms) if (r !== socket.id) socket.leave(r);

      const room = getOrCreateRoom(roomId, row.host_id);

      if (
        row.max_members &&
        room.members.size >= row.max_members &&
        socket.data.userId !== room.hostId
      ) {
        socket.emit("room:error", "room-full");
        return;
      }

      socket.join(`room:${roomId}`);
      socket.data.roomId = roomId;

      const member = {
        socketId: socket.id,
        userId: socket.data.userId,
        name: socket.data.userName,
        pic: socket.data.pic,
      };
      room.members.set(socket.id, member);

      socket.emit("room:state", {
        roomId,
        hostId: room.hostId,
        members: [...room.members.values()],
        timer: snapshotTimer(room.timer),
      });
      socket.to(`room:${roomId}`).emit("member:joined", member);
    });

    socket.on("chat:send", (raw) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const now = Date.now();
      const last = socket.data.lastChatAt || 0;
      const remaining = CHAT_COOLDOWN_MS - (now - last);
      if (remaining > 0) {
        socket.emit("chat:cooldown", { remainingMs: remaining });
        return;
      }
      const text = String((raw && raw.text) || "").trim().slice(0, 500);
      if (!text) return;
      socket.data.lastChatAt = now;
      io.to(`room:${roomId}`).emit("chat:message", {
        fromId: socket.data.userId,
        fromName: socket.data.userName,
        text,
        ts: now,
      });
    });

    function hostCtx() {
      const roomId = socket.data.roomId;
      if (!roomId) return null;
      const room = rooms.get(roomId);
      if (!room) return null;
      if (room.hostId !== socket.data.userId) return null;
      return { roomId, room };
    }

    socket.on("timer:set", (raw) => {
      const ctx = hostCtx();
      if (!ctx) return;
      const minutes = Number(raw && raw.durationMin);
      const phase = raw && raw.phase === "break" ? "break" : "focus";
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 180) return;
      stopTick(ctx.room);
      const ms = Math.round(minutes * 60 * 1000);
      ctx.room.timer = {
        phase,
        durationMs: ms,
        remainingMs: ms,
        startedAt: null,
        running: false,
      };
      broadcastTimer(io, ctx.roomId, ctx.room);
    });

    socket.on("timer:start", () => {
      const ctx = hostCtx();
      if (!ctx) return;
      const t = ctx.room.timer;
      if (t.running) return;
      if (t.remainingMs <= 0) t.remainingMs = t.durationMs;
      t.startedAt = Date.now();
      t.running = true;
      broadcastTimer(io, ctx.roomId, ctx.room);
      stopTick(ctx.room);
      ctx.room.tickHandle = setInterval(() => {
        const snap = snapshotTimer(t);
        io.to(`room:${ctx.roomId}`).emit("timer:tick", snap);
        if (!snap.running) {
          t.running = false;
          t.remainingMs = 0;
          t.startedAt = null;
          stopTick(ctx.room);
        }
      }, 1000);
    });

    socket.on("timer:pause", () => {
      const ctx = hostCtx();
      if (!ctx) return;
      const t = ctx.room.timer;
      if (!t.running || t.startedAt === null) return;
      const elapsed = Date.now() - t.startedAt;
      t.remainingMs = Math.max(0, t.remainingMs - elapsed);
      t.startedAt = null;
      t.running = false;
      stopTick(ctx.room);
      broadcastTimer(io, ctx.roomId, ctx.room);
    });

    socket.on("timer:reset", () => {
      const ctx = hostCtx();
      if (!ctx) return;
      const t = ctx.room.timer;
      t.running = false;
      t.startedAt = null;
      t.remainingMs = t.durationMs;
      stopTick(ctx.room);
      broadcastTimer(io, ctx.roomId, ctx.room);
    });

    socket.on("user:kick", (raw) => {
      const ctx = hostCtx();
      if (!ctx) return;
      const target = Number(raw && raw.userId);
      if (!Number.isFinite(target) || target === ctx.room.hostId) return;
      for (const [sid, m] of ctx.room.members) {
        if (m.userId === target) {
          io.to(sid).emit("kicked");
          const s = io.sockets.sockets.get(sid);
          if (s) s.disconnect(true);
        }
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      const room = rooms.get(roomId);
      if (!room) return;
      const member = room.members.get(socket.id);
      room.members.delete(socket.id);
      if (member) {
        io.to(`room:${roomId}`).emit("member:left", {
          socketId: socket.id,
          userId: member.userId,
        });
      }
      if (room.members.size === 0) {
        stopTick(room);
        rooms.delete(roomId);
      }
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> FocusRoom ready on http://localhost:${port} (${dev ? "dev" : process.env.NODE_ENV})`,
    );
  });
});