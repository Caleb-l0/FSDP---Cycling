-- ===========================
-- 1. DROP ALL FOREIGN KEYS SAFELY
-- ===========================
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = @sql + '
ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + '].[' + OBJECT_NAME(parent_object_id) + '] 
DROP CONSTRAINT [' + name + '];'
FROM sys.foreign_keys;

EXEC sp_executesql @sql;


-- ===========================
-- 2. DROP ALL TABLES SAFELY
-- ===========================
SET @sql = N'';

SELECT @sql = @sql + '
DROP TABLE IF EXISTS [' + TABLE_SCHEMA + '].[' + TABLE_NAME + '];'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

EXEC sp_executesql @sql;




CREATE TABLE Users (
  id INT PRIMARY KEY IDENTITY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100)
);    ALTER TABLE Users
ADD role VARCHAR(50) DEFAULT 'user';


CREATE TABLE Organizations (
    OrganizationID INT IDENTITY(1,1) PRIMARY KEY,
    OrgName NVARCHAR(100) NOT NULL,
    OrgDescription NVARCHAR(500),
    ContactEmail NVARCHAR(100),
    ContactPhone NVARCHAR(20),
    CreatedAt DATETIME DEFAULT GETDATE(),
);



CREATE TABLE UserOrganizations (
    UserOrgID INT IDENTITY(1,1) PRIMARY KEY,    
    UserID INT NOT NULL,                        
    OrganizationID INT NOT NULL,                
    OrgEmail NVARCHAR(100),                      
    OrgRole NVARCHAR(50) DEFAULT 'member',       
    JoinedAt DATETIME DEFAULT GETDATE(),         

    CONSTRAINT FK_UserOrganizations_Users
        FOREIGN KEY (UserID) REFERENCES Users(id)
        ON DELETE CASCADE,

    CONSTRAINT FK_UserOrganizations_Organizations
        FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID)
        ON DELETE CASCADE
);



CREATE TABLE Events (
    EventID INT PRIMARY KEY IDENTITY,
    Location NVARCHAR(MAX),
    OrganizationID INT,
    EventName NVARCHAR(100) NOT NULL,
    EventDate DATETIME NOT NULL,
    Description NVARCHAR(MAX),
    RequiredVolunteers INT NOT NULL,
	PeopleSignUp INT,
    Status NVARCHAR(20) DEFAULT 'Upcoming',   -- Upcoming / Ongoing / Completed / Cancelled
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,



    CONSTRAINT FK_Events_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID)
);



CREATE TABLE VolunteerRequests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    RequesterID INT NULL,
    EventID INT NOT NULL,
    EventName NVARCHAR(100) NOT NULL,
    EventDate DATETIME NOT NULL,
    Description NVARCHAR(MAX),
    RequiredVolunteers INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Outdated, Rejected
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL,
    ReviewedBy INT NULL,
    ReviewDate DATETIME NULL,
    ReviewComments NVARCHAR(500),

    
    CONSTRAINT FK_VolunteerRequests_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID),

    CONSTRAINT FK_VolunteerRequests_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID)
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

/* Table to track who is booking, how many people are included in the booking and when it was booked for what event*/
CREATE TABLE EventBookings (
    BookingID INT PRIMARY KEY IDENTITY,
    EventID INT NOT NULL,
    OrganizationID INT NOT NULL,
    Participants INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_EventBookings_Events FOREIGN KEY (EventID)
        REFERENCES Events(EventID),

    CONSTRAINT FK_EventBookings_Organizations FOREIGN KEY (OrganizationID)
        REFERENCES Organizations(OrganizationID)
);
