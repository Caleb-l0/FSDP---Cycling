INSERT INTO users (name, email, password, role) VALUES
('Alice Tan', 'alice@test.com', 'hashed_pw', 'volunteer'),
('Ben Lim', 'ben@test.com', 'hashed_pw', 'volunteer'),
('Chris Ong', 'chris@test.com', 'hashed_pw', 'volunteer'),
('Diana Lee', 'diana@test.com', 'hashed_pw', 'institution'),
('Admin User', 'admin@test.com', 'hashed_pw', 'admin');

INSERT INTO organizations (orgname, orgdescription, contactemail) VALUES
('CWA', 'Community Welfare Association', 'contact@cwa.org'),
('Lions Befrienders', 'Senior care and befriending services', 'info@lions.org'),
('SG Cares', 'National volunteering movement', 'hello@sgcares.sg');

INSERT INTO userorganizations (userid, organizationid, orgrole) VALUES
(4, 1, 'admin'),
(4, 2, 'admin'),
(4, 3, 'admin');

INSERT INTO events (
  eventname, eventdate, location, description,
  requiredvolunteers, maximumparticipant, organizationid
) VALUES
('Food Distribution Drive', NOW() + INTERVAL '5 days', 'Toa Payoh', 'Help distribute food', 10, 20, 1),
('Senior Befriending', NOW() + INTERVAL '10 days', 'Bedok', 'Visit seniors weekly', 15, 30, 2),
('Beach Cleanup', NOW() + INTERVAL '15 days', 'East Coast Park', 'Environmental cleanup', 20, 50, 3),
('Blood Donation', NOW() + INTERVAL '20 days', 'Red Cross HQ', 'Assist donors', 8, 15, 1);


INSERT INTO eventsignups (eventid, userid) VALUES
(1, 1),
(1, 2),
(2, 1),
(2, 3),
(3, 2),
(3, 3),
(4, 1);



INSERT INTO communityposts (userid, content, visibility, taggedinstitutionid) VALUES
(1, 'Had an amazing time helping out today!', 'public', 1),
(2, 'First time volunteering, learned a lot ❤️', 'public', 2),
(3, 'Volunteering connects people.', 'friends', NULL),
(1, 'Looking forward to the next event!', 'public', 3),
(2, 'Anyone joining the beach cleanup?', 'public', 3);


INSERT INTO communitylikes (postid, userid) VALUES
(1, 2),
(1, 3),
(2, 1),
(3, 1),
(3, 2),
(4, 3),
(5, 1);



UPDATE communityposts cp
SET likecount = sub.cnt
FROM (
  SELECT postid, COUNT(*) AS cnt
  FROM communitylikes
  GROUP BY postid
) sub
WHERE cp.postid = sub.postid;



INSERT INTO communitycomments (postid, userid, commenttext) VALUES
(1, 2, 'Great job! 👏'),
(1, 3, 'Thanks for contributing!'),
(2, 1, 'Welcome to volunteering!'),
(3, 2, 'Well said!'),
(4, 3, 'See you there!');



INSERT INTO rewards (user_id, points, description) VALUES
(1, 120, 'Participation points'),
(2, 80, 'Event attendance'),
(3, 150, 'Outstanding volunteer'),
(1, 50, 'Bonus reward');



SELECT * FROM users;
SELECT * FROM organizations;
SELECT * FROM events;
SELECT * FROM communityposts;
SELECT * FROM communitylikes;
SELECT * FROM communitycomments;




