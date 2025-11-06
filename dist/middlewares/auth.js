import jwt from "jsonwebtoken";
function getTokenFromRequest(req) {
    // 1) Cookie (requires cookie-parser)
    const cookieToken = req.cookies?.token;
    if (cookieToken)
        return cookieToken;
    // 2) Authorization header: "Bearer <token>"
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
        return auth.slice("Bearer ".length).trim();
    }
    return null;
}
export const isAuthenticated = (req, res, next) => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: token missing" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            // Fail fast with clear message in server logs; send generic to client
            console.error("JWT_SECRET is not configured");
            return res.status(500).json({ message: "Server config error" });
        }
        // Use the sync form to get proper typing and try/catch
        const decoded = jwt.verify(token, secret);
        // Validate shape
        if (!decoded || typeof decoded !== "object") {
            return res.status(401).json({ message: "Unauthorized: bad token" });
        }
        // Narrow to our payload
        const { userId, role } = decoded;
        if (!userId || (role !== "USER" && role !== "ADMIN")) {
            return res.status(401).json({ message: "Unauthorized: invalid payload" });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ message: "You are not allowed to access this resource" });
        }
        next();
    };
};
