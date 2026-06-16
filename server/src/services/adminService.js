const adminRepository = require('../repositories/adminRepository');
const auditRepository = require('../repositories/auditRepository');

async function getSummary() {
  const counts = await adminRepository.getSummaryCounts();
  const recentActivity = await auditRepository.findRecent(10);

  return {
    ...counts,
    recentActivity
  };
}

module.exports = {
  getSummary
};
