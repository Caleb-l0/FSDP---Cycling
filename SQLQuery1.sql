select *
from Users

select *
from Users where name = 'jack'

select *
from Events

select *
from VolunteerRequests

SELECT Status from VolunteerRequests
      WHERE RequestID = 1



INSERT INTO Users (name, email, password, role) VALUES
('Alice Tan', 'alice@example.com', 'hashedpassword1', 'user'),
('Bob Lee', 'bob@example.com', 'hashedpassword2', 'user'),
('Charlie Admin', 'admin@example.com', 'admin123', 'admin');


INSERT INTO Organizations (OrgName, OrgDescription, ContactEmail, ContactPhone)
VALUES
('Happy Elderly Centre', 'A community centre serving seniors.', 'contact@happyelderly.org', '1234-5678'),
('Sunshine Volunteers', 'Volunteer group offering community services.', 'hello@sunshine.org', '9876-5432');

INSERT INTO Events (Location, OrganizationID, EventName, EventDate, Description, RequiredVolunteers, PeopleSignUp, Status)
VALUES
('Jurong East Hall', 1, 'Elderly Fitness Day', '2025-12-20 10:00:00', 'Morning exercise with seniors.', 10, 2, 'Upcoming'),
('Bukit Batok Park', 2, 'Park Cleaning Activity', '2025-12-18 09:00:00', 'Cleaning up the community park.', 15, 5, 'Upcoming');

INSERT INTO VolunteerRequests
(OrganizationID, RequesterID, EventID, EventName, EventDate, Description, RequiredVolunteers, Status)
VALUES
(1, 1, 1, 'Elderly Fitness Day', '2025-12-20 10:00:00', 'Requesting volunteers to support elderly event.', 10, 'Approved'),

(2, 2, 2, 'Park Cleaning Activity', '2025-12-18 09:00:00', 'Need volunteers to keep the park clean.', 15, 'Pending');


INSERT INTO EventSignUps (EventID, UserID, Status)
VALUES
(1, 1, 'Active'),
(1, 2, 'Active'),
(2, 1, 'Active'),
(2, 3, 'Active');


