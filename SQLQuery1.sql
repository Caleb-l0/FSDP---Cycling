select *
from Users

select *
from Users where name = 'jack'


select *
from VolunteerRequests


DELETE FROM EventSignUps;
DELETE FROM UserEvents;
DELETE FROM Events;
DELETE FROM VolunteerRequests;
DELETE FROM Organizations;
DELETE FROM Users;

DBCC CHECKIDENT ('Users', RESEED, 0);
DBCC CHECKIDENT ('Organizations', RESEED, 0);
DBCC CHECKIDENT ('VolunteerRequests', RESEED, 0);
DBCC CHECKIDENT ('Events', RESEED, 0);
DBCC CHECKIDENT ('EventSignUps', RESEED, 0);
DBCC CHECKIDENT ('UserEvents', RESEED, 0);



INSERT INTO Users (name, email, password, role)
VALUES
('Alice Tan', 'alice@example.com', 'password123', 'admin'),
('Ben Wong', 'ben@example.com', 'password456', 'organization'),
('Cindy Lee', 'cindy@example.com', 'password789', 'volunteer');

INSERT INTO Organizations (OrgName, OrgDescription, ContactEmail, ContactPhone)
VALUES
('Green Earth SG', 'An environmental NGO focusing on sustainability.', 'contact@greenearth.sg', '+65 6123 4567'),
('Helping Hands', 'Community support organization providing volunteer opportunities.', 'hello@helpinghands.sg', '+65 6234 7890');


INSERT INTO VolunteerRequests
(
    OrganizationID,
    RequesterID,
    EventName,
    EventDate,
    Description,
    RequiredVolunteers,
    Status
)
VALUES
(1, 2, N'Beach Clean-Up', '2025-12-10 09:00:00', N'Join us to clean up East Coast Beach.', 15, N'Approved'),
(2, 3, N'Food Donation Drive', '2025-11-25 10:00:00', N'Collect food items for needy families.', 8, N'Pending');


INSERT INTO Events
(
    VolunteerRequestID,
    OrganizationID,
    EventName,
    EventDate,
    Description,
    RequiredVolunteers,
    Status
)
VALUES
(1, 1, N'Beach Clean-Up 2025', '2025-12-10 09:00:00', N'Help keep our beaches clean.', 15, N'Upcoming'),
(2, 2, N'Food Donation Drive 2025', '2025-11-25 10:00:00', N'Collect food items and pack them for donation.', 8, N'Upcoming');


INSERT INTO EventSignUps (EventID, UserID, Status)
VALUES
(1, 3, N'Active'),
(2, 3, N'Active');


INSERT INTO UserEvents (UserID, EventID)
VALUES
(3, 1),
(3, 2);
