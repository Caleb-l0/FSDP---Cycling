DROP TABLE IF EXISTS UserEvents;
DROP TABLE IF EXISTS EventSignUps;
DROP TABLE IF EXISTS Events;
DROP TABLE IF EXISTS VolunteerRequests;
DROP TABLE IF EXISTS Organizations;
DROP TABLE IF EXISTS Users;



CREATE TABLE Users (
  id INT PRIMARY KEY IDENTITY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100)
);    ALTER TABLE Users
ADD role VARCHAR(50) DEFAULT 'user';


CREATE TABLE Organizations (
    OrganizationID INT IDENTITY(1,1) PRIMARY KEY,
    OrgName NVARCHAR(100) NOT NULL,
    OrgDescription NVARCHAR(500),
    ContactEmail NVARCHAR(100),
    ContactPhone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
);



CREATE TABLE VolunteerRequests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    RequesterID INT NULL,
    EventName NVARCHAR(100) NOT NULL,
    EventDate DATETIME NOT NULL,
    Description NVARCHAR(MAX),
    RequiredVolunteers INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Outdated, rejected
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    ReviewedBy INT NULL,
    ReviewDate DATETIME NULL,
    ReviewComments NVARCHAR(500),

    
    CONSTRAINT FK_VolunteerRequests_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID),

    CONSTRAINT FK_VolunteerRequests_Users FOREIGN KEY (RequesterID)
        REFERENCES Users(id)
);


CREATE TABLE Events (
    EventID INT PRIMARY KEY IDENTITY,
    VolunteerRequestID INT NULL,
    OrganizationID INT NOT NULL,
    EventName NVARCHAR(100) NOT NULL,
    EventDate DATETIME NOT NULL,
    Description NVARCHAR(MAX),
    RequiredVolunteers INT NOT NULL,
	PeopleSignUp INT,
    Status NVARCHAR(20) DEFAULT 'Upcoming',   -- Upcoming / Ongoing / Completed / Cancelled
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,

    CONSTRAINT FK_Events_VolunteerRequests FOREIGN KEY (VolunteerRequestID)
        REFERENCES VolunteerRequests(RequestID),

    CONSTRAINT FK_Events_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID)
);



CREATE TABLE EventSignUps (
    SignUpID INT PRIMARY KEY IDENTITY,
    EventID INT NOT NULL,
    UserID INT NOT NULL,
    SignUpDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT 'Active',     -- Active / Cancelled / Completed

    CONSTRAINT FK_EventSignUps_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID),

    CONSTRAINT FK_EventSignUps_Users FOREIGN KEY (UserID)
        REFERENCES Users(id)
);


CREATE TABLE UserEvents (
    UserEventID INT PRIMARY KEY IDENTITY,
    UserID INT NOT NULL,
    EventID INT NOT NULL,
    SignUpDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_UserEvents_Users FOREIGN KEY (UserID)
        REFERENCES Users(id),

    CONSTRAINT FK_UserEvents_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID)
);
