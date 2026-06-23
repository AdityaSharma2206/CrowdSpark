import jwt from "jsonwebtoken";
import UserModel from "../models/user-model.js";

export const authenticationMiddleware = async (req, res, next) => {
  try {
    const cookies = req.cookies
    const token = cookies.token;
    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    const decodedUserObject = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedUserObject) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    req.user = decodedUserObject;
    next();
  } catch (error) {
    // An invalid or expired token is a client problem (401), not a server
    // fault (500). jwt.verify throws TokenExpiredError/JsonWebTokenError here.
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: invalid or expired token" });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Authorization: allow only admins. Must run AFTER authenticationMiddleware,
// which populates req.user. The JWT payload does not carry isAdmin, so we
// re-load the user from the database to get the current privilege level.
export const requireAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: admin access required" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Authorization: allow the resource's own user OR an admin. Use for routes
// keyed by a user id in the URL (e.g. /update/:id, /user-reports/:id).
export const requireSelfOrAdmin = (param = "id") => async (req, res, next) => {
  try {
    if (req.params[param] === req.user.userId) {
      return next();
    }
    const user = await UserModel.findById(req.user.userId);
    if (user && user.isAdmin) {
      return next();
    }
    return res.status(403).json({ message: "Forbidden: not allowed for this resource" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
