
INSERT INTO Users (name, email, password, role)
VALUES
('Alice Tan', 'alice@example.com', 'hashedpwd1', 'user'),
('Bob Lee', 'bob@example.com', 'hashedpwd2', 'user'),
('Charlie Wong', 'charlie@example.com', 'hashedpwd3', 'admin'),
('David Lim', 'david@example.com', 'hashedpwd4', 'user');


INSERT INTO Organizations (OrgName, OrgDescription, ContactEmail, ContactPhone)
VALUES
('Lions Befrienders', 'Supporting seniors through activities', 'contact@lb.org', '61234567'),
('Cycling Without Age', 'Providing seniors with outdoor cycling rides', 'info@cwa.org', '69887766');

INSERT INTO UserOrganizations (UserID, OrganizationID, OrgEmail, OrgRole)
VALUES
(1, 1, 'alice_lb@lb.org', 'member'),
(2, 1, 'bob_lb@lb.org', 'staff'),
(3, 2, 'charlie_cwa@cwa.org', 'admin'),
(4, 2, 'david_cwa@cwa.org', 'member');

INSERT INTO Events 
(Location, OrganizationID, EventName, EventDate, Description, RequiredVolunteers, VolunteerSignUp, MaximumParticipant, PeopleSignUp)
VALUES
('Ang Mo Kio Park', 1, 'Senior Morning Walk', '2025-12-01 08:00:00',
 'Morning nature walk with seniors', 10, 3, 30, 12),

('East Coast Park', 2, 'Cycling with Seniors', '2025-12-05 09:00:00',
 'Trishaw riding activity with seniors', 8, 5, 20, 15),

('Jurong Lake Gardens', 1, 'Picnic & Games', '2025-12-12 10:00:00',
 'Outdoor picnic and bonding games', 12, 4, 25, 18);

 INSERT INTO VolunteerRequests
(OrganizationID, RequesterID, EventID, EventName, EventDate, Description, RequiredVolunteers, Status)
VALUES
(1, 1, 1, 'Senior Morning Walk', '2025-12-01 08:00:00', 'Request for additional volunteers', 10, 'Pending'),
(2, 3, 2, 'Cycling with Seniors', '2025-12-05 09:00:00', 'Need more volunteers for trishaw rides', 8, 'Approved'),
(1, 2, 3, 'Picnic & Games', '2025-12-12 10:00:00', 'Event support needed', 12, 'Pending');

INSERT INTO EventSignUps (EventID, UserID, Status)
VALUES
(1, 1, 'Active'),
(1, 2, 'Active'),
(2, 3, 'Active'),
(2, 4, 'Cancelled'),
(3, 1, 'Active');

INSERT INTO UserEvents (UserID, EventID)
VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(1, 3);

INSERT INTO EventBookings (EventID, OrganizationID, Participants)
VALUES
(1, 1, 12),
(2, 2, 15),
(3, 1, 18);
