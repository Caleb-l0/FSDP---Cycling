const model = require("../Models/Volunteer_Community_Model");
const pool = require("../Postgres_config");

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
            events: events.filter(e => e.organizationid === inst.organizationid)
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

async function browseInstitutionFeed(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const lim = req.query?.limit;

    const orgRes = await pool.query(
      `SELECT organizationid FROM userorganizations WHERE userid = $1 LIMIT 1`,
      [req.user.id]
    );
    const orgId = orgRes.rows?.[0]?.organizationid;

    if (!orgId) return res.json([]);

    const posts = await model.getPostsForInstitution(orgId, lim || 8);

    const hydrated = [];
    for (const p of posts) {
      const comments = await model.getCommentsForPost(p.postid);
      hydrated.push({ ...p, comments: comments || [] });
    }

    return res.json(hydrated);
  } catch (err) {
    res.status(500).json({ message: "Failed to load institution feed", error: err.message });
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
    browseInstitutionFeed,
    browseVolunteers,
    getInstitutions,
    toggleLike,
    getComments,createComment
   
};
