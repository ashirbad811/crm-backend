const User = require('../models/User');

const getAccessibleUserIds = async (user, moduleName, action) => {
  const role = user.role;
  // If role is not populated or no permissions, restrict to own
  if (!role || !role.permissions) return [user._id];
  
  const perm = role.permissions.find(p => p.module === moduleName);
  // If no permission for this module or action, return empty array (no access)
  if (!perm || !perm.actions.includes(action)) {
    return []; 
  }

  if (perm.scope === 'ALL') {
    return null; // null indicates ALL access
  }

  if (perm.scope === 'TEAM') {
    const teamMembers = await User.find({ manager: user._id }).select('_id');
    return [user._id, ...teamMembers.map(m => m._id)];
  }

  // default 'OWN'
  return [user._id];
};

const applyRBACFilter = async (query, user, moduleName, action, requestedAssignedTo = null) => {
  const allowedIds = await getAccessibleUserIds(user, moduleName, action);
  
  if (allowedIds && allowedIds.length === 0) {
    // No access, force an impossible query
    query._id = null;
    return query;
  }

  if (allowedIds === null) {
    // ALL access
    if (requestedAssignedTo) {
      query.assignedTo = requestedAssignedTo;
    }
    return query;
  }

  if (requestedAssignedTo) {
    const isAllowed = allowedIds.some(id => id.toString() === requestedAssignedTo.toString());
    query.assignedTo = isAllowed ? requestedAssignedTo : null;
  } else {
    query.assignedTo = { $in: allowedIds };
  }

  return query;
};

const checkRecordAccess = async (recordAssignedTo, user, moduleName, action) => {
  if (!recordAssignedTo) return false;
  
  const allowedIds = await getAccessibleUserIds(user, moduleName, action);
  if (allowedIds && allowedIds.length === 0) return false;
  if (allowedIds === null) return true; // ALL

  return allowedIds.some(id => id.toString() === recordAssignedTo.toString());
};

module.exports = { getAccessibleUserIds, applyRBACFilter, checkRecordAccess };
