const db = require('../config/db');

async function getSummaryCounts() {
  const [[userCounts]] = await db.execute(
    `SELECT
      COUNT(*) AS totalUsers,
      SUM(role = 'admin') AS adminUsers,
      SUM(is_blocked = TRUE) AS blockedUsers
     FROM users`
  );
  const [[postCounts]] = await db.execute('SELECT COUNT(*) AS totalPosts FROM posts');
  const [[todoCounts]] = await db.execute('SELECT COUNT(*) AS totalTodos FROM todos');
  const [[commentCounts]] = await db.execute('SELECT COUNT(*) AS totalComments FROM comments');
  const [[albumCounts]] = await db.execute('SELECT COUNT(*) AS totalAlbums FROM albums');
  const [[photoCounts]] = await db.execute('SELECT COUNT(*) AS totalPhotos FROM photos');

  return {
    totalUsers: Number(userCounts.totalUsers),
    adminUsers: Number(userCounts.adminUsers || 0),
    blockedUsers: Number(userCounts.blockedUsers || 0),
    totalPosts: Number(postCounts.totalPosts),
    totalTodos: Number(todoCounts.totalTodos),
    totalComments: Number(commentCounts.totalComments),
    totalAlbums: Number(albumCounts.totalAlbums),
    totalPhotos: Number(photoCounts.totalPhotos)
  };
}

module.exports = {
  getSummaryCounts
};
