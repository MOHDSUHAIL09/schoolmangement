export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const effectiveRoles = [...allowedRoles];
    if (allowedRoles.includes('super_admin') || allowedRoles.includes('principal')) {
      if (!effectiveRoles.includes('admin')) {
        effectiveRoles.push('admin');
      }
    }

    if (!effectiveRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};
