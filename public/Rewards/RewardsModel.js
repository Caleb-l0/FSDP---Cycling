const db = require("../../dbconfig");


async function getRewardsByUser(userId) {
    await sql.connect(db);
    const result = await sql.query`
        SELECT RewardID, Points, Description, DateEarned
        FROM Rewards
        WHERE UserID = ${userId}    
        ORDER BY DateEarned DESC
    `;
    return result.recordset;
}
async function addReward(userId, points, description) {
    await sql.connect(db);
    const result = await sql.query`
        INSERT INTO Rewards (UserID, Points, Description, DateEarned)
        VALUES (${userId}, ${points}, ${description}, GETDATE())
    `;
    return result;
}
async function getTotalPoints(userId) {
    await sql.connect(db);
    const result = await sql.query`
        SELECT SUM(Points) AS TotalPoints
        FROM Rewards
        WHERE UserID = ${userId}
    `;
    return result.recordset[0].TotalPoints || 0;
}   

module.exports = { getRewardsByUser, addReward, getTotalPoints };
