const { checkForAuthenticationCookie } = require("./checkAuth"); // Adjust if your file structure is different

// Restrict to Logged-in Users Only
const restrictToLoggedInUserOnly = (req, res, next) => {
    if (!req.user) {
        return res.redirect("/user/signin");
    }
    next();
};

// Restrict to Specific Roles (Admin)
const restrictTo = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.redirect("/user/signin");
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).send("Access Denied: Admins Only");
        }
        next();
    };
};

module.exports = { 
    checkForAuthenticationCookie, 
    restrictTo, 
    restrictToLoggedInUserOnly 
};
