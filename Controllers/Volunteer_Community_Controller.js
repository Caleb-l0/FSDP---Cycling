const model = require("../Models/Volunteer_Community_Model");

async function createPost(req, res) {
    try {
        const userID = req.user.id;
        const body = req.body;

        if (!body.content || body.content.trim() === "") {
            return res.status(400).json({ message: "Content is required" });
        }

        const postData = {
             userid: userID,
  content: body.content,          
  photourl: body.photourl || null,
  visibility: body.visibility || "public",
  taggedinstitutionid: body.taggedinstitutionid || null
        };

        const result = await model.createPost(postData);
        res.status(201).json({ message: "Post created", post: result });

    } catch (err) {
        res.status(500).json({ message: "Failed to create post", error: err.message });
    }
}





async function getInstitutions(req, res) {
    try {
        const { institutions, events } = await model.getAllInstitutions();

        const grouped = institutions.map(inst => ({
            ...inst,
            Events: events.filter(e => e.OrganizationID === inst.OrganizationID)
        }));

        res.json(grouped);
    } catch {
        res.status(500).json({ message: "Failed to load institutions" });
    }
}


async function browsePosts(req, res) {
    try {
        const posts = await model.getAllPosts();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Failed to load posts" });
    }
}

async function browseVolunteers(req, res) {
    try {
        const volunteers = await model.getAllVolunteers();
        res.json(volunteers);
    } catch (err) {
        res.status(500).json({ message: "Failed to load volunteers" });
    }
}


async function toggleLike(req, res) {
    try {
        const userId = req.user.id;
        const postId = parseInt(req.params.postId);

        if (isNaN(postId)) {
            return res.status(400).json({ message: "Invalid postId" });
        }

        const alreadyLiked = await model.hasLiked(postId, userId);

        if (alreadyLiked) {
            await model.unlikePost(postId, userId);
            return res.json({ liked: false });
        } else {
            await model.likePost(postId, userId);
            return res.json({ liked: true });
        }

    } catch (err) {
        console.error("LIKE ERROR:", err);
        res.status(500).json({ message: "Failed to toggle like", error: err.message });
    }
}


async function createComment(req, res) {
    try {
        const userId = req.user.id;
        const { postId } = req.params;
        const { CommentText } = req.body;

        if (!CommentText || CommentText.trim() === "") {
            return res.status(400).json({ message: "Comment cannot be empty" });
        }

        const comment = await model.createComment(parseInt(postId), userId, CommentText);
        res.status(201).json(comment);

    } catch (err) {
        console.error("COMMENT ERROR:", err);
        res.status(500).json({ message: "Failed to create comment", error: err.message });
    }
}


async function getComments(req, res) {
    try {
        const postId = req.params.postId;
        const comments = await model.getCommentsForPost(postId);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: "Failed to load comments" });
    }
}





module.exports = {
    createPost,
       browsePosts,
    browseVolunteers,
    getInstitutions,
    toggleLike,
    getComments,createComment
   
};
