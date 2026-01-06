INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@cyclingwithoutage.sg', 'hashed_password', 'admin'),
('Volunteer One', 'vol1@example.com', 'hashed_password', 'volunteer'),
('Volunteer Two', 'vol2@example.com', 'hashed_password', 'volunteer');

INSERT INTO organizations (orgname, orgdescription, contactemail, contactphone)
VALUES (
    'Cycling Without Age Singapore',
    'Providing seniors with free trishaw rides to enhance wellbeing and social connection.',
    'info@cyclingwithoutage.sg',
    '+65 6123 4567'
);
INSERT INTO userorganizations (userid, organizationid, orgrole) VALUES
(1, 1, 'admin'),
(2, 1, 'volunteer'),
(3, 1, 'volunteer');

INSERT INTO events (
    location,
    maximumparticipant,
    organizationid,
    eventname,
    eventdate,
    description,
    requiredvolunteers,
    latitude,
    longitude
) VALUES
(
    'East Coast Park',
    20,
    1,
    'Cycling Without Age – East Coast Park Ride',
    '2026-02-18 08:30:00',
    'Provide seniors with a safe and joyful trishaw cycling experience.',
    6,
    1.3016,
    103.9125
),
(
    'Punggol Waterway Park',
    24,
    1,
    'Cycling Without Age – Punggol Waterway Experience',
    '2026-02-22 09:00:00',
    'Scenic trishaw rides for seniors along Punggol Waterway.',
    8,
    1.4052,
    103.9023
),
(
    'Bishan–Ang Mo Kio Park',
    18,
    1,
    'Cycling Without Age – Bishan Park Morning Ride',
    '2026-02-26 08:00:00',
    'Calm morning cycling session for seniors.',
    5,
    1.3636,
    103.8464
);


INSERT INTO volunterrequests (
    organizationid,
    requesterid,
    eventid,
    eventname,
    eventdate,
    description,
    requiredvolunteers
) VALUES (
    1,
    1,
    1,
    'Cycling Without Age – East Coast Park Ride',
    '2026-02-18 08:30:00',
    'Requesting volunteers to assist with trishaw cycling.',
    6
);
INSERT INTO eventsignups (eventid, userid) VALUES
(1, 2),
(1, 3),
(2, 2);


INSERT INTO rewards (user_id, points, description) VALUES
(2, 50, 'Participation in East Coast Park Ride'),
(3, 50, 'Participation in East Coast Park Ride');


INSERT INTO shopitems (name, description, cost) VALUES
('$5 NTUC Voucher', 'Redeemable at all NTUC outlets', 50),
('$10 NTUC Voucher', 'Redeemable at all NTUC outlets', 100),
('Volunteer T-Shirt', 'Official Cycling Without Age Volunteer T-Shirt', 200);


INSERT INTO communityposts (userid, content, visibility)
VALUES (
    2,
    'Had an amazing time cycling with seniors today! 🚲❤️',
    'public'
);

