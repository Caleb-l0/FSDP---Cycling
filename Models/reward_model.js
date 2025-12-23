const pool = require("../Postgres_config");
// ===============================
// 1. Get user's total points
// ===============================
async function getUserPoints(userId) {
  const result = await pool.query(
    `
    SELECT COALESCE(SUM(points), 0) AS total
    FROM rewards
    WHERE user_id = $1
    `,
    [userId]
  );

  return parseInt(result.rows[0].total);
}

// ===============================
// 2. Get all shop items
// ===============================
async function getAllItems() {
  const result = await pool.query(`
    SELECT itemid, name, description, cost
    FROM shopitems
    ORDER BY cost ASC
  `);

  // 
  return result.rows.map(item => ({
    ItemID: item.itemid,
    Name: item.name,
    Description: item.description,
    Cost: item.cost
  }));
}

// ===============================
// 3. Get single item by ID
// ===============================
async function getItemById(itemId) {
  const result = await pool.query(
    `
    SELECT itemid, name, description, cost
    FROM shopitems
    WHERE itemid = $1
    `,
    [itemId]
  );

  if (result.rows.length === 0) return null;

  const item = result.rows[0];
  return {
    ItemID: item.itemid,
    Name: item.name,
    Description: item.description,
    Cost: item.cost
  };
}

// ===============================
// 4. Redeem item (deduct points)
// ===============================
async function redeemItem(userId, item) {
  // 
  await pool.query(
    `
    INSERT INTO rewards (user_id, points, description)
    VALUES ($1, $2, $3)
    `,
    [
      userId,
      -item.Cost,
      `Redeemed ${item.Name}`
    ]
  );

  //
  const voucherCode = `VOUCHER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  await pool.query(
    `
    UPDATE rewards
    SET vouchercode = $1
    WHERE id = (
      SELECT id FROM rewards
      WHERE user_id = $2
      ORDER BY dateearned DESC
      LIMIT 1
    )
    `,
    [voucherCode, userId]
  );
}

// ===============================
// 5. Redemption history
// ===============================
async function getHistory(userId) {
  const result = await pool.query(
    `
    SELECT
      r.points,
      r.dateearned,
      r.vouchercode,
      r.description
    FROM rewards r
    WHERE r.user_id = $1
    ORDER BY r.dateearned DESC
    `,
    [userId]
  );

  return result.rows.map(row => ({
    Points: Math.abs(row.points),
    RedeemedAt: row.dateearned,
    VoucherCode: row.vouchercode,
    ItemName: row.description.replace("Redeemed ", "")
  }));
}

module.exports = {
  getUserPoints,
  getAllItems,
  getItemById,
  redeemItem,
  getHistory
};

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