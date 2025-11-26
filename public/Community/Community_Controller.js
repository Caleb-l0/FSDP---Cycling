const CommunityModel = require("./Community/Community_Model");

async function createPost(req, res) {
    try {
        const { content, photoURL } = req.body;
        const userId = req.user.id;
        await CommunityModel.createPost(userId, content, photoURL);
        res.status(201).json({ message: "Post created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create post" });
    }   
}
async function getUserPosts(req, res) {
    try {
        const userId = req.user.id;
        const posts = await CommunityModel.getPostsByUser(userId);
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load posts" });
    }
}
async function getAllPosts(req, res) {
    try {
        const posts = await CommunityModel.getAllPosts();
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to load posts" });
    }
}

module.exports = { createPost, getUserPosts, getAllPosts };