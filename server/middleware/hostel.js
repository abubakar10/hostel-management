// Middleware to set hostel context for non-super-admin users
export const setHostelContext = (req, res, next) => {
  // Super admin can access any hostel via query param
  if (req.user.role === 'super_admin') {
    req.hostelId = req.query.hostel_id || req.body.hostel_id || req.user.hostel_id;
  } else {
    // Regular admins are restricted to their own hostel
    req.hostelId = req.user.hostel_id;
  }

  if (!req.hostelId && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'No hostel assigned to user' });
  }

  next();
};

