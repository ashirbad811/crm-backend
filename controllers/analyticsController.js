const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');

const { applyRBACFilter } = require('../utils/rbac');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const matchQuery = await applyRBACFilter({}, req.user, 'Dashboard', 'View');

    // Leads Stats
    const totalLeads = await Lead.countDocuments(matchQuery);
    const newLeads = await Lead.countDocuments({ ...matchQuery, status: 'New' });
    const qualifiedLeads = await Lead.countDocuments({ ...matchQuery, status: 'Qualified' });
    const convertedLeads = await Lead.countDocuments({ ...matchQuery, isConverted: true });
    const lostLeads = await Lead.countDocuments({ ...matchQuery, status: { $in: ['Lost', 'Unqualified'] } });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;

    // Customer Stats
    const totalCustomers = await Customer.countDocuments(matchQuery);
    
    // Deal Stats
    const totalDeals = await Deal.countDocuments(matchQuery);
    const wonDeals = await Deal.countDocuments({ ...matchQuery, stage: 'Won' });
    const lostDeals = await Deal.countDocuments({ ...matchQuery, stage: 'Lost' });
    const openDeals = totalDeals - wonDeals - lostDeals;

    // Revenue Calculation
    const deals = await Deal.find(matchQuery);
    let pipelineValue = 0;
    let expectedRevenue = 0;
    let wonRevenue = 0;

    deals.forEach(deal => {
      pipelineValue += deal.value;
      expectedRevenue += deal.expectedRevenue;
      if (deal.stage === 'Won') {
        wonRevenue += deal.value;
      }
    });

    // Activities Stats
    const actMatchQuery = await applyRBACFilter({}, req.user, 'Dashboard', 'View');
    const pendingActivities = await Activity.countDocuments({ ...actMatchQuery, status: 'Pending' });
    const completedActivities = await Activity.countDocuments({ ...actMatchQuery, status: 'Completed' });
    const overdueActivities = await Activity.countDocuments({ ...actMatchQuery, status: 'Overdue' }); // Simple check if status is overdue

    res.json({
      leads: { total: totalLeads, new: newLeads, qualified: qualifiedLeads, converted: convertedLeads, lost: lostLeads, conversionRate },
      customers: { total: totalCustomers },
      deals: { total: totalDeals, open: openDeals, won: wonDeals, lost: lostDeals, pipelineValue, expectedRevenue, wonRevenue },
      activities: { pending: pendingActivities, completed: completedActivities, overdue: overdueActivities }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
