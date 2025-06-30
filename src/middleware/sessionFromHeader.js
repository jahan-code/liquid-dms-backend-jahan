export default function sessionFromHeader(sessionStore) {
  return (req, res, next) => {
    const sessionId = req.headers['x-session-id'];
    if (!sessionId) return next();

    sessionStore.get(sessionId, (err, session) => {
      if (err || !session) return next(); // fallback to default session
      req.session = session;
      req.sessionID = sessionId;
      next();
    });
  };
}
