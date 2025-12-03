

/*const sql = require("mssql");
const db = require("../dbconfig");

// Get user points
async function getUserPoints(userId) {
    const pool = await sql.connect(db);
    const result = await pool.request()
        .input("UserID", sql.Int, userId)
        .query(`SELECT Points FROM UserPoints WHERE UserID = @UserID`);
    
    return result.recordset.length ? result.recordset[0].Points : 0;
}

// Get all shop items
async function getAllItems() {
    const pool = await sql.connect(db);
    const result = await pool.request().query(`
        SELECT * FROM ShopItems ORDER BY Cost ASC
    `);
    return result.recordset;
}

// Get item details
async function getItemById(itemId) {
    const pool = await sql.connect(db);
    const result = await pool.request()
        .input("ItemID", sql.Int, itemId)
        .query(`SELECT * FROM ShopItems WHERE ItemID = @ItemID`);
    
    return result.recordset[0];
}

// Redeem item
async function redeemItem(userId, item) {
    const pool = await sql.connect(db);

    await pool.request()
        .input("UserID", sql.Int, userId)
        .input("Points", sql.Int, item.Cost)
        .input("Description", sql.NVarChar, item.Name)
        .query(`
            INSERT INTO Rewards (user_id, Points, Description)
            VALUES (@UserID, @Points, @Description)
        `);

    await pool.request()
        .input("UserID", sql.Int, userId)
        .input("Cost", sql.Int, item.Cost)
        .query(`
            UPDATE UserPoints
            SET Points = Points - @Cost
            WHERE UserID = @UserID
        `);
}

// Get redemption history
async function getHistory(userId) {
    const pool = await sql.connect(db);
    const result = await pool.request()
        .input("UserID", sql.Int, userId)
        .query(`
            SELECT 
                Description AS ItemName,
                Points,
                dateEarned AS RedeemedAt
            FROM Rewards
            WHERE user_id = @UserID
            ORDER BY dateEarned DESC
        `);

    return result.recordset;
}

module.exports = {
    getUserPoints,
    getAllItems,
    getItemById,
    redeemItem,
    getHistory
};
*/ 