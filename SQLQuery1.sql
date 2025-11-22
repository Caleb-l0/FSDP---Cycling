INSERT INTO Users (name, email, password, role)
VALUES
('Alice Tan', 'alice@example.com', '123456', 'admin'),
('Ben Lim', 'ben@example.com', '123456', 'user'),
('Charlotte Ong', 'charlotte@example.com', '123456', 'user'),
('Daniel Goh', 'daniel@example.com', '123456', 'user');

INSERT INTO Organizations (OrgName, OrgDescription, ContactEmail, ContactPhone)
VALUES
('Happy Volunteer Org', 'Main organization managing volunteers', 'contact@hvo.com', '91234567'),
('SilverCare Community', 'Supporting senior activities and wellness', 'info@silvercare.com', '98765432'),
('GreenRide Initiative', 'Promotes healthy lifestyle via cycling events', 'admin@greenride.com', '90011223');


INSERT INTO UserOrganizations (UserID, OrganizationID, OrgEmail, OrgRole)
VALUES
(1, 1, 'alice@example.com', 'admin'),
(2, 1, 'ben@example.com', 'member'),
(3, 2, 'charlotte@example.com', 'member'),
(4, 3, 'daniel@example.com', 'member');


INSERT INTO Events
(Location, MaximumParticipant, OrganizationID, EventName, EventDate, Description, RequiredVolunteers, Status)
VALUES
('Jurong Lake Gardens', 20, 1, 'Morning Lake Ride', '2025-11-25 09:00:00',
 'A peaceful morning ride around Jurong Lake for seniors.', 4, 'Upcoming'),

('Passion Wave Marina Bay', 25, 1, 'Marina Bay Sunset Tour', '2025-11-26 18:00:00',
 'Enjoy sunset views while riding with volunteers and seniors.', 5, 'Upcoming'),

('Gardens by the Bay', 18, 2, 'Flower Dome Wellness Ride', '2025-11-27 10:00:00',
 'Light cycling activity around the Flower Dome area.', 3, 'Upcoming');


 INSERT INTO VolunteerRequests
(OrganizationID, RequesterID, EventID, EventName, EventDate, Description, RequiredVolunteers, Status)
VALUES
(1, 2, 1, 'Morning Lake Ride', '2025-11-25 09:00:00',
 'Requesting volunteers for morning ride event.', 4, 'Approved'),

(2, 3, 3, 'Flower Dome Wellness Ride', '2025-11-27 10:00:00',
 'Requesting volunteers for wellness ride.', 3, 'Pending');


 INSERT INTO EventSignUps (EventID, UserID, Status)
VALUES
(1, 2, 'Active'),
(1, 3, 'Active'),
(2, 4, 'Active');


INSERT INTO UserEvents (UserID, EventID)
VALUES
(2, 1),
(3, 1),
(4, 2);


INSERT INTO EventBookings (EventID, OrganizationID, Participants)
VALUES
(1, 1, 5),
(2, 1, 3),
(3, 2, 4);
