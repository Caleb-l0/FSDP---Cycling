const model = require("../Models/Volunteer_Community_Model");

async function createPost(req, res) {
    try {
        const userID = req.user.id;
        const body = req.body;

        if (!body.Content || body.Content.trim() === "") {
            return res.status(400).json({ message: "Content is required" });
        }

        const postData = {
            UserID: userID,
            Content: body.Content,
            PhotoURL: body.PhotoURL || null,
            Visibility: body.Visibility || "public",
            TaggedInstitutionID: body.TaggedInstitutionID || null
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






module.exports = {
    createPost,
       browsePosts,
    browseVolunteers,
    getInstitutions,
};
