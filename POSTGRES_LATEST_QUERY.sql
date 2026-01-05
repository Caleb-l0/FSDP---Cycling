

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    textsizepreference VARCHAR(20) DEFAULT 'normal',
    role VARCHAR(50) DEFAULT 'user'
);

CREATE TABLE organizations (
    organizationid SERIAL PRIMARY KEY,
    orgname VARCHAR(100) NOT NULL,
    orgdescription TEXT,
    contactemail VARCHAR(100),
    contactphone VARCHAR(20),
    createdat TIMESTAMP DEFAULT NOW()
);
CREATE TABLE userorganizations (
    userorgid SERIAL PRIMARY KEY,
    userid INT NOT NULL,
    organizationid INT NOT NULL,
    orgemail VARCHAR(100),
    orgrole VARCHAR(50) DEFAULT 'member',
    joinedat TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organizationid) REFERENCES organizations(organizationid) ON DELETE CASCADE
);

CREATE TABLE events (
    eventid SERIAL PRIMARY KEY,
    location TEXT,
    maximumparticipant INT NOT NULL,
    organizationid INT,
    eventname VARCHAR(100) NOT NULL,
    eventdate TIMESTAMP NOT NULL,
    description TEXT,
    requiredvolunteers INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Upcoming',
    createdat TIMESTAMP DEFAULT NOW(),
    updatedat TIMESTAMP,
    peoplesignup INT DEFAULT 0,
    FOREIGN KEY (organizationid) REFERENCES organizations(organizationid)
);


CREATE TABLE volunterrequests (
    requestid SERIAL PRIMARY KEY,
    organizationid INT NOT NULL,
    requesterid INT,
    eventid INT NOT NULL,
    eventname VARCHAR(100) NOT NULL,
    eventdate TIMESTAMP NOT NULL,
    description TEXT,
    requiredvolunteers INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    createdat TIMESTAMP DEFAULT NOW(),
    updatedat TIMESTAMP,
    reviewedby INT,
    reviewdate TIMESTAMP,
    reviewcomments VARCHAR(500),
    FOREIGN KEY (organizationid) REFERENCES organizations(organizationid),
    FOREIGN KEY (eventid) REFERENCES events(eventid)
);

CREATE TABLE eventsignups (
    signupid SERIAL PRIMARY KEY,
    eventid INT NOT NULL,
    userid INT NOT NULL,
    signupdate TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY (eventid) REFERENCES events(eventid),
    FOREIGN KEY (userid) REFERENCES users(id)
);

CREATE TABLE userevents (
    usereventid SERIAL PRIMARY KEY,
    userid INT NOT NULL,
    eventid INT NOT NULL,
    signupdate TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (userid) REFERENCES users(id),
    FOREIGN KEY (eventid) REFERENCES events(eventid)
);

CREATE TABLE eventbookings (
    bookingid SERIAL PRIMARY KEY,
    eventid INT NOT NULL,
    organizationid INT NOT NULL,
    participants INT NOT NULL,
    createdat TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (eventid) REFERENCES events(eventid),
    FOREIGN KEY (organizationid) REFERENCES organizations(organizationid)
);

CREATE TABLE rewards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    description VARCHAR(255),
    dateearned TIMESTAMP DEFAULT NOW(),
    vouchercode VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE shopitems (
    itemid SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    cost INT
);

INSERT INTO shopitems (name, description, cost) VALUES
('$5 NTUC Voucher', '$5 grocery voucher from all NTUC outlets', 50),
('$10 NTUC Voucher', '$10 grocery voucher from all NTUC outlets', 100),
('Volunteer T-Shirt', 'Official Volunteer T-Shirt', 200);

CREATE TABLE communityposts (
    postid SERIAL PRIMARY KEY,

    userid INT NOT NULL,
    content TEXT NOT NULL,
    photourl VARCHAR(255),

    likecount INT DEFAULT 0 CHECK (likecount >= 0),

    visibility VARCHAR(20) DEFAULT 'public'
        CHECK (visibility IN ('public', 'friends', 'private')),

    taggedinstitutionid INT,

    createdat TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_post_user
        FOREIGN KEY (userid)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_post_org
        FOREIGN KEY (taggedinstitutionid)
        REFERENCES organizations(organizationid)
        ON DELETE SET NULL
);


CREATE TABLE communitylikes (
    likeid SERIAL PRIMARY KEY,

    postid INT NOT NULL,
    userid INT NOT NULL,
    likedat TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_like_post
        FOREIGN KEY (postid)
        REFERENCES communityposts(postid)
        ON DELETE CASCADE,

    CONSTRAINT fk_like_user
        FOREIGN KEY (userid)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_like
        UNIQUE (postid, userid)
);




CREATE TABLE communitycomments (
    commentid SERIAL PRIMARY KEY,

    postid INT NOT NULL,
    userid INT NOT NULL,

    commenttext TEXT NOT NULL,
    createdat TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_comment_post
        FOREIGN KEY (postid)
        REFERENCES communityposts(postid)
        ON DELETE CASCADE,

    CONSTRAINT fk_comment_user
        FOREIGN KEY (userid)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE INDEX idx_posts_createdat
ON communityposts(createdat DESC);

CREATE INDEX idx_comments_postid
ON communitycomments(postid);


CREATE INDEX idx_likes_postid
ON communitylikes(postid);





