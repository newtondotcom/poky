export interface WebSocketSession {
  ws: any;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
}

class WebSocketSessionManager {
  private sessions = new Map<string, WebSocketSession>();
  private userSessions = new Map<string, Set<string>>(); // userId -> Set of sessionIds

  /**
   * Add a new WebSocket session
   */
  addSession(sessionId: string, userId: string, ws: any): void {
    const session: WebSocketSession = {
      ws,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(sessionId, session);

    // Track user's sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId)!.add(sessionId);

    console.log(`➕ WebSocket Session added: ${sessionId} for user: ${userId}`);
    console.log(`📊 Total sessions: ${this.sessions.size}, Users online: ${this.userSessions.size}`);
  }

  /**
   * Remove a session
   */
  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const { userId } = session;
    
    // Remove from sessions map
    this.sessions.delete(sessionId);

    // Remove from user's sessions
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }

    console.log(`➖ WebSocket Session removed: ${sessionId} for user: ${userId}`);
    console.log(`📊 Total sessions: ${this.sessions.size}, Users online: ${this.userSessions.size}`);
  }

  /**
   * Update session activity
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Send notification to a specific user (all their sessions)
   */
  sendToUser(userId: string, notification: any): boolean {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions || userSessions.size === 0) {
      console.log(`❌ No active sessions for user: ${userId}`);
      return false;
    }

    let sentCount = 0;
    const brokenSessions: string[] = [];

    for (const sessionId of userSessions) {
      const session = this.sessions.get(sessionId);
      if (session && session.ws.readyState === 1) { // WebSocket.OPEN
        try {
          session.ws.send(JSON.stringify(notification));
          sentCount++;
          this.updateActivity(sessionId);
        } catch (error) {
          console.error(`Failed to send notification to session ${sessionId}:`, error);
          brokenSessions.push(sessionId);
        }
      } else {
        brokenSessions.push(sessionId);
      }
    }

    // Clean up broken sessions
    brokenSessions.forEach(sessionId => this.removeSession(sessionId));

    console.log(`📤 Sent notification to user ${userId} across ${sentCount} sessions`);
    return sentCount > 0;
  }

  /**
   * Send poke notification
   */
  sendPokeNotification(fromUserId: string, toUserId: string, pokeData: any): boolean {
    const notification = {
      type: "poke",
      from: fromUserId,
      data: pokeData,
      timestamp: new Date().toISOString(),
    };

    return this.sendToUser(toUserId, notification);
  }

  /**
   * Get all sessions for a specific user
   */
  getUserSessions(userId: string): WebSocketSession[] {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) return [];

    return Array.from(userSessions)
      .map(sessionId => this.sessions.get(sessionId))
      .filter((session): session is WebSocketSession => session !== undefined);
  }

  /**
   * Get all connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(this.userSessions.keys());
  }

  /**
   * Get session count for a user
   */
  getUserSessionCount(userId: string): number {
    return this.userSessions.get(userId)?.size || 0;
  }

  /**
   * Get total session count
   */
  getTotalSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get total user count
   */
  getTotalUserCount(): number {
    return this.userSessions.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSessions.has(userId);
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): WebSocketSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Clean up inactive sessions (older than specified minutes)
   */
  cleanupInactiveSessions(minutes: number = 30): void {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const toRemove: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.lastActivity < cutoff) {
        toRemove.push(sessionId);
      }
    }

    toRemove.forEach(sessionId => this.removeSession(sessionId));
    
    if (toRemove.length > 0) {
      console.log(`🧹 Cleaned up ${toRemove.length} inactive sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalSessions: this.getTotalSessionCount(),
      totalUsers: this.getTotalUserCount(),
      connectedUsers: this.getConnectedUsers(),
    };
  }
}

// Export singleton instance
export const wsSessionManager = new WebSocketSessionManager(); 