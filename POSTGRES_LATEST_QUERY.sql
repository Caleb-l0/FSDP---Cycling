

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    textsizepreference VARCHAR(20) DEFAULT 'normal',
    role VARCHAR(50) DEFAULT 'volunteer'
);
ALTER TABLE users
ADD COLUMN level INT DEFAULT 1 CHECK (level >= 1),
ADD COLUMN joindate TIMESTAMP DEFAULT NOW();

ALTER TABLE users
ADD COLUMN phone VARCHAR(20) UNIQUE,
ADD COLUMN firebase_uid VARCHAR(100);

-- Add homeaddress column (note: using homeaddress, not homeAddress for PostgreSQL)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS homeaddress VARCHAR(255);

-- Add phonenumber column (note: profile uses phonenumber, but users table has 'phone')
-- If phone exists, we can use it, or add phonenumber as separate
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phonenumber VARCHAR(20);

-- Add advantages column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS advantages TEXT;




/* for institution user test */
INSERT INTO userorganizations (userid, organizationid, orgemail, orgrole, joinedat)
VALUES (
    19,                                       
    1,                                        
    (SELECT email FROM users WHERE id = 19),  
    'admin',                                  
    NOW()
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
ALTER TABLE events
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;
ADD COLUMN participantsignup INT DEFAULT 0;
ADD COLUMN eventimage VARCHAR(255);


CREATE TABLE volunterrequests (   /* supposed to be institution requests please ignore this error, because change make time */
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


CREATE TABLE friendrequests (
    requestid SERIAL PRIMARY KEY,

    userid INT NOT NULL,      
    friendid INT NOT NULL,    

    requesttype VARCHAR(20) DEFAULT 'friend'
        CHECK (requesttype IN ('friend')),

    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),

    requestdate TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_friendrequest_user
        FOREIGN KEY (userid)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_friendrequest_friend
        FOREIGN KEY (friendid)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_friend_request
        UNIQUE (userid, friendid)
);

ALTER TABLE friendrequests
ADD COLUMN IF NOT EXISTS requestreason TEXT;



CREATE TABLE badges (
    badgeid SERIAL PRIMARY KEY,

    badgetype VARCHAR(50) NOT NULL,
    -- e.g. 'hours', 'events', 'community', 'mentor'

    badgename VARCHAR(100) NOT NULL,
    -- e.g. '100+ Volunteer Hours'

    description TEXT,

    iconurl VARCHAR(255),
   

    requirementvalue INT,
    -- e.g. 100 hours / 10 events

    isactive BOOLEAN DEFAULT TRUE,

    createdat TIMESTAMP DEFAULT NOW()
);


CREATE TABLE userbadges (
    userbadgeid SERIAL PRIMARY KEY,

    userid INT NOT NULL,
    badgeid INT NOT NULL,

    getdate TIMESTAMP DEFAULT NOW(),

    source VARCHAR(50),
    -- e.g. 'system', 'admin', 'event'

    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'revoked')),

    CONSTRAINT fk_user_badge_user
        FOREIGN KEY (userid)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_badge_badge
        FOREIGN KEY (badgeid)
        REFERENCES badges(badgeid)
        ON DELETE CASCADE,

    CONSTRAINT unique_user_badge
        UNIQUE (userid, badgeid)
);



CREATE TABLE userfriends (
    userfriendid SERIAL PRIMARY KEY,

    userid INT NOT NULL,
    friendid INT NOT NULL,

    adddate TIMESTAMP DEFAULT NOW(),

    friend_level INT DEFAULT 1
        CHECK (friend_level >= 1),

    nickname VARCHAR(100),
    description TEXT,

    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'blocked', 'removed')),

    CONSTRAINT fk_userfriends_user
        FOREIGN KEY (userid)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_userfriends_friend
        FOREIGN KEY (friendid)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_not_self_friend
        CHECK (userid <> friendid),

    CONSTRAINT unique_user_friend
        UNIQUE (userid, friendid)
);





INSERT INTO badges (badgetype, badgename, description, requirementvalue)
VALUES
('hours', '100+ Volunteer Hours', 'Completed over 100 hours of volunteering', 100),
('events', '10 Events Joined', 'Participated in 10 volunteer events', 10),
('community', 'Community Star', 'Outstanding contribution to community', NULL),
('mentor', 'Volunteer Mentor', 'Guided new volunteers', NULL);




TRUNCATE TABLE
    communitylikes,
    communitycomments,
    communityposts,
    rewards,
    eventbookings,
    userevents,
    eventsignups,
    volunterrequests,
    events,
    userorganizations,
    organizations,
    users,
    shopitems
RESTART IDENTITY CASCADE;