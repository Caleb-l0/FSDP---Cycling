/*Model for CREATE TABLE CommunityPosts (
  PostID INT PRIMARY KEY AUTO_INCREMENT,
  UserID INT NOT NULL,
  Content TEXT NOT NULL,
  PhotoURL VARCHAR(255),
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (UserID) REFERENCES Users(UserID)
);*/

const sql = require("mssql");
const db = require("../../dbconfig");

async function createPost(userId, content, photoURL) {
    await sql.connect(db);
    return sql.query`
        INSERT INTO CommunityPosts (UserID, Content, PhotoURL)
        VALUES (${userId}, ${content}, ${photoURL})
    `;
}
async function getPostsByUser(userId) {
    await sql.connect(db);
    const result = await sql.query`
        SELECT * FROM CommunityPosts
        WHERE UserID = ${userId}
        ORDER BY CreatedAt DESC
    `;
    return result.recordset;
}
async function getAllPosts() {
    await sql.connect(db);
    const result = await sql.query`
        SELECT * FROM CommunityPosts
        ORDER BY CreatedAt DESC
    `;
    return result.recordset;
}
module.exports = { createPost, getPostsByUser, getAllPosts };
