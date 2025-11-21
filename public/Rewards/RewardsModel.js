const sql = require("mssql");
const db = require("../../dbconfig");

async function getUserPoints(userId) {
    await sql.connect(db);
    const result = await sql.query`
        SELECT SUM(Points) AS TotalPoints
        FROM Rewards
        WHERE user_ID = ${userId}
    `;
    return result.recordset[0].TotalPoints || 0;
}

async function redeemItem(userId, item) {
    await sql.connect(db);
    return sql.query`
        INSERT INTO Rewards (user_id, Points, Description)
        VALUES (${userId}, ${-item.Cost}, ${'Redeemed: ' + item.Name})
    `;
}

async function getAllItems() {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM ShopItems`;
    return result.recordset;
}

async function getItemById(itemId) {
    await sql.connect(db);
    const result = await sql.query`SELECT * FROM ShopItems WHERE ItemID = ${itemId}`;
    return result.recordset[0];
}

module.exports = { getUserPoints, redeemItem, getAllItems, getItemById };


