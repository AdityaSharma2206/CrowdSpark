import jwt from "jsonwebtoken";

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
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
